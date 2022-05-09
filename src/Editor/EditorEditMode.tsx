import { useAtom } from 'jotai';
import { findLast } from 'lodash';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useEffect, useRef, useState } from 'react';
import Split from 'react-split';

import { DiffMarker, DiffMarkers, getDiffMarkers } from '../api/diffMarkers';
import { changesAtom, changesOrderAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { saveDeltaAtom } from '../atoms/saveDeltaAtom';
import { getFileContent } from '../utils/getFileContent';
import {
  getMonacoEdits,
  getTabChar,
  modifiedModel,
  originalModel,
  previewModel,
} from '../utils/monaco';

export function EditorEditMode() {
  const modifiedContentListener = useRef<monaco.IDisposable>();
  const diffListener = useRef<monaco.IDisposable>();
  const diffMouseDownListener = useRef<monaco.IDisposable>();
  const monacoDom = useRef<HTMLDivElement>(null);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const decorations = useRef<string[]>([]);
  const [activeFile] = useAtom(activeFileAtom);
  const [, saveDelta] = useAtom(saveDeltaAtom);
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);

  const highlightUndo = useRef<
    {
      range: monaco.Range;
      text: string;
    }[]
  >([]);

  const [diffMarkers, setDiffMarkers] = useState<DiffMarkers>({});
  //const [originalColored, setOriginalColored] = useState<string[]>([]);

  useEffect(() => {
    // initializing editor
    if (!monacoDom.current) return;

    editor.current?.dispose();
    diffListener.current?.dispose();
    diffMouseDownListener.current?.dispose();

    editor.current = monaco.editor.create(monacoDom.current, {
      automaticLayout: true,
      theme: 'defaultDark',
      glyphMargin: true,
      smoothScrolling: true,
      tabSize: 2,
    });

    editor.current.setModel(modifiedModel);

    return () => {
      editor.current?.dispose();
      modifiedContentListener.current?.dispose();
      modifiedModel.setValue('');
      originalModel.setValue('');
    };
  }, [monacoDom]);

  useEffect(() => {
    modifiedContentListener.current?.dispose();

    if (!activeFile) {
      originalModel.setValue('');
      modifiedModel.setValue('');
      return;
    }

    // setOriginalColored([]);
    // monaco.editor
    //   .colorize(originalModel.getValue(), 'typescript', { tabSize: 2 })
    //   .then((html) => {
    //     const el = document.createElement('div');
    //     el.innerHTML = html;

    //     let spanPerLine = [];
    //     for (const child of el.children) {
    //       if (child.tagName === 'BR') {
    //         continue;
    //       }
    //       spanPerLine.push(child.innerHTML);
    //     }

    //     setOriginalColored(spanPerLine);
    //   });

    const previousChangeId = findLast(
      changesOrder,
      (id) => changes[id].path === activeFile.path
    );

    const current = previousChangeId
      ? getFileContent({
          changeId: previousChangeId,
          changes,
          changesOrder,
        })
      : activeFile.oldVal;

    const goal = activeFile.newVal;

    if (modifiedModel.getValue() !== current) {
      modifiedModel.setValue(current);
    }
    if (previewModel.getValue() !== current) {
      previewModel.setValue(current);
    }
    if (originalModel.getValue() !== goal) {
      originalModel.setValue(goal);
    }

    const markers = getDiffMarkers(
      modifiedModel.getValue(),
      originalModel.getValue(),
      getTabChar(modifiedModel)
    );

    setDiffMarkers(markers);

    modifiedContentListener.current = modifiedModel.onDidChangeContent((e) => {
      let saved = new Delta();

      e.changes
        .sort((c1, c2) => c1.rangeOffset - c2.rangeOffset)
        .forEach((change) => {
          const delta = new Delta();
          delta.retain(change.rangeOffset);
          delta.delete(change.rangeLength);
          delta.insert(change.text);
          saveDelta(saved.transform(delta));

          saved = saved.compose(delta);
        });
    });
  }, [activeFile, changesOrder, saveDelta, setDiffMarkers]); // not watching changes as dep, because it is covered by changesOrder

  const diffMarkerMouseEnterHandle = (marker: DiffMarker) => () => {
    const viewstate = editor.current?.saveViewState();

    editor.current?.updateOptions({
      scrollbar: {
        vertical: 'hidden',
        horizontal: 'hidden',
      },
    });

    const modifiedValue = modifiedModel.getValue();
    const previewValue = previewModel.getValue();

    if (modifiedValue !== previewValue) {
      previewModel.setValue(modifiedValue);
    }

    editor.current?.setModel(previewModel);

    if (viewstate) {
      editor.current?.restoreViewState(viewstate);
    }

    if (marker.operation === 'delete') {
      const edits = getMonacoEdits(marker.delta, previewModel);
      decorations.current = editor.current!.deltaDecorations(
        decorations.current,
        [
          {
            range: edits[0].range,
            options: {
              className: 'delete-highlight',
            },
          },
        ]
      );
      editor.current?.revealRangeInCenterIfOutsideViewport(
        edits[0].range,
        monaco.editor.ScrollType.Smooth
      );
    } else {
      const edits = getMonacoEdits(marker.delta, previewModel);
      if (edits.length === 0) return;

      highlightUndo.current = previewModel.applyEdits(edits, true);

      decorations.current = editor.current!.deltaDecorations(
        decorations.current,
        highlightUndo.current.map((edit) => ({
          range: edit.range,
          options: {
            className: 'insert-highlight',
          },
        }))
      );

      const startRange = highlightUndo.current[0].range;
      const endRange =
        highlightUndo.current[highlightUndo.current.length - 1].range;

      editor.current?.revealRangeInCenterIfOutsideViewport(
        new monaco.Range(
          startRange.startLineNumber,
          startRange.startColumn,
          endRange.endLineNumber,
          endRange.endColumn
        ),
        monaco.editor.ScrollType.Smooth
      );
    }
  };

  const diffMarkerMouseLeaveHandle = (marker: DiffMarker) => () => {
    previewModel.applyEdits(highlightUndo.current);
    highlightUndo.current = [];

    const viewstate = editor.current?.saveViewState();
    editor.current?.setModel(modifiedModel);
    if (viewstate) {
      editor.current?.restoreViewState(viewstate);
    }

    const modifiedValue = modifiedModel.getValue();
    const previewValue = previewModel.getValue();
    if (modifiedValue !== previewValue) {
      previewModel.setValue(modifiedValue);
    }

    editor.current?.updateOptions({
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
      },
    });
  };

  const diffMarkerClickHandle = (marker: DiffMarker) => () => {
    const edits = getMonacoEdits(marker.delta, modifiedModel);
    modifiedModel.applyEdits(edits);
    editor.current?.setModel(modifiedModel);
  };

  return (
    <Split
      className="split-editor"
      direction="horizontal"
      sizes={[60, 40]}
      gutterSize={1}
    >
      <div ref={monacoDom} className="monaco edit-mode"></div>
      <div
        style={{
          position: 'relative',
          height: '100%',
          overflow: 'auto',
          background: 'rgb(32 36 40)',
        }}
      >
        {Object.values(diffMarkers)
          .sort((a, b) => a.originalOffset - b.originalOffset)
          .map((marker, i) => (
            <div key={i} style={{ background: 'rgb(40 49 56)', padding: 10 }}>
              <div
                style={{
                  width: '100%',
                  height: 50,
                  marginTop: 10,
                  overflow: 'auto',
                  background: '#374957',
                }}
                onMouseEnter={diffMarkerMouseEnterHandle(marker)}
                onMouseLeave={diffMarkerMouseLeaveHandle(marker)}
                onClick={diffMarkerClickHandle(marker)}
              >
                <div style={{ margin: 0 }}>{marker.operation}</div>
              </div>
            </div>
          ))}
      </div>
    </Split>
  );
}
