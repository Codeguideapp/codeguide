import { useAtom } from 'jotai';
import { findLast } from 'lodash';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Split from 'react-split';

import {
  DiffMarker,
  DiffMarkers,
  getDiffMarkers,
  isIndentMarker,
} from '../api/diffMarkers';
import { changesAtom, changesOrderAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { saveDeltaAtom } from '../atoms/saveDeltaAtom';
import { composeDeltas } from '../utils/deltaUtils';
import { getFileContent } from '../utils/getFileContent';
import {
  getMonacoEdits,
  getRange,
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
  const activeMarkerIndex = useRef<number>(-1);

  useEffect(() => {
    // reset active marker when path changes
    activeMarkerIndex.current = -1;
  }, [activeFile?.path]);

  const highlightUndo = useRef<
    {
      range: monaco.Range;
      text: string;
    }[]
  >([]);

  const [diffMarkers, setDiffMarkers] = useState<DiffMarkers>({});

  const markerIds = useMemo(
    () =>
      Object.values(diffMarkers)
        .sort((a, b) => a.originalOffset - b.originalOffset)
        .sort((a, b) => (isIndentMarker(a) ? 1 : isIndentMarker(b) ? -1 : 0))
        .map((m) => m.id),
    [diffMarkers]
  );

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
      //wordWrap: 'on',
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

    const previousChangeId = findLast(
      changesOrder,
      (id) => changes[id].path === activeFile.path
    );

    const current = previousChangeId
      ? getFileContent({
          upToChangeId: previousChangeId,
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
      getTabChar(modifiedModel),
      modifiedModel.getEOL()
    );

    setDiffMarkers(markers);

    modifiedContentListener.current = modifiedModel.onDidChangeContent((e) => {
      const deltas: Delta[] = [];

      if (
        activeFile.status !== 'added' &&
        !changesOrder.find((id) => changes[id].path === activeFile.path)
      ) {
        // this is first time change is saved for a file
        saveDelta({
          file: activeFile,
          isFileDepChange: true,
          delta: new Delta().insert(activeFile.oldVal),
          eolChar: modifiedModel.getEOL(),
        });
      }

      e.changes
        .sort((c1, c2) => c2.rangeOffset - c1.rangeOffset)
        .forEach((change) => {
          const delta = new Delta();
          delta.retain(change.rangeOffset);
          delta.delete(change.rangeLength);
          delta.insert(change.text);
          deltas.push(delta);
        });

      saveDelta({
        delta: composeDeltas(deltas),
        file: activeFile,
        eolChar: modifiedModel.getEOL(),
      });
    });
  }, [activeFile, changesOrder, saveDelta, setDiffMarkers]); // not watching changes as dep, because it is covered by changesOrder

  const activateDiffMarker = useCallback((marker: DiffMarker) => {
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

    previewModel.updateOptions(modifiedModel.getOptions());
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
    } else if (marker.operation === 'replace') {
      const delta = new Delta()
        .retain(marker.modifiedOffset)
        .retain(marker.oldValue.length)
        .insert(marker.newValue);

      const edits = getMonacoEdits(delta, previewModel);

      if (edits.length === 0) return;

      highlightUndo.current = previewModel.applyEdits(edits, true);

      decorations.current = editor.current!.deltaDecorations(
        decorations.current,
        [
          {
            range: getRange(
              previewModel,
              marker.modifiedOffset,
              marker.oldValue.length
            ),
            options: {
              className: 'delete-highlight',
            },
          },
          ...highlightUndo.current.map((edit) => ({
            range: edit.range,
            options: {
              className: 'insert-highlight',
            },
          })),
        ]
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
  }, []);

  const resetDiffMarkers = useCallback(() => {
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
  }, []);

  const applyDiffMarker = useCallback((marker: DiffMarker) => {
    const edits = getMonacoEdits(marker.delta, modifiedModel);
    modifiedModel.applyEdits(edits);

    const viewstate = editor.current?.saveViewState();
    editor.current?.setModel(modifiedModel);
    if (viewstate) {
      editor.current?.restoreViewState(viewstate);
    }
  }, []);

  useEffect(() => {
    if (activeMarkerIndex.current !== -1) {
      const id = markerIds[activeMarkerIndex.current];
      if (id) {
        activateDiffMarker(diffMarkers[id]);
      }
    }
  }, [diffMarkers, markerIds, activateDiffMarker]);

  return (
    <Split
      className="split-editor"
      direction="horizontal"
      sizes={[70, 30]}
      gutterSize={1}
    >
      <div ref={monacoDom} className="monaco edit-mode"></div>
      <div className="diff-markers-wrap">
        {markerIds.map((markerId) => {
          const marker = diffMarkers[markerId];

          const markerType = isIndentMarker(marker)
            ? 'indent'
            : marker.operation;

          const addedChars =
            marker.operation === 'insert' || marker.operation === 'replace'
              ? marker.newValue.length
              : 0;

          const deletedChars =
            marker.operation === 'delete' || marker.operation === 'replace'
              ? marker.oldValue.length
              : 0;

          return (
            <div
              key={marker.id}
              className={`diff-marker`}
              onMouseEnter={() => {
                activeMarkerIndex.current = markerIds.indexOf(marker.id);
                activateDiffMarker(marker);
              }}
              onMouseLeave={() => {
                activeMarkerIndex.current = -1;
                resetDiffMarkers();
              }}
              onClick={() => {
                applyDiffMarker(marker);
              }}
            >
              <div className="head">
                <div className="operation">
                  <span className={`dot ${markerType}`}></span>
                  <span className="text">{markerType}</span>
                </div>
                <span className="stat">
                  <span className="additions">+{addedChars}</span>
                  <span className="deletions">-{deletedChars}</span>
                </span>
              </div>
              <div className="code-preview">
                {Object.entries(marker.preview || {}).map(([line, content]) => (
                  <div key={line}>
                    <span className="linenumber">{line}:</span>
                    {content.map((c, i) => {
                      return (
                        <span
                          key={`${line}-${i}`}
                          className={c.isDelete ? 'strikethrough' : ''}
                        >
                          {c.code}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Split>
  );
}
