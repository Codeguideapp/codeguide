import { useAtom } from 'jotai';
import { findLast, isEqual } from 'lodash';
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
  getTabChar,
  modifiedModel,
  originalModel,
  previewModel,
  removeDeletions,
  removeInserts,
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
  const appliedMarkerRef = useRef<{
    edits: monaco.editor.IIdentifiedSingleEditOperation[];
    marker: DiffMarker;
  }>();

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

    const markers = getDiffMarkers({
      modifiedValue: modifiedModel.getValue(),
      originalValue: originalModel.getValue(),
      tab: getTabChar(modifiedModel),
      eol: modifiedModel.getEOL(),
    });

    const appliedMarkers: DiffMarkers = Object.values(changes).reduce(
      (acc, c) => {
        if (!c.diffMarker || c.path !== activeFile.path) {
          return acc;
        }
        return {
          ...acc,
          [c.diffMarker.id]: {
            ...c.diffMarker,
            changeId: c.id,
          },
        };
      },
      {} as DiffMarkers
    );

    setDiffMarkers({ ...markers, ...appliedMarkers });

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
        diffMarker: isEqual(
          appliedMarkerRef.current?.edits,
          e.changes.map((c) => ({ range: c.range, text: c.text }))
        )
          ? appliedMarkerRef.current?.marker
          : undefined,
      });
    });
  }, [activeFile, changesOrder, saveDelta, setDiffMarkers]); // not watching changes as dep, because it is covered by changesOrder

  const activateDiffMarker = useCallback(
    (marker: DiffMarker) => {
      const viewstate = editor.current?.saveViewState();

      editor.current?.updateOptions({
        scrollbar: {
          vertical: 'hidden',
          horizontal: 'hidden',
        },
      });

      const modifiedValue = modifiedModel.getValue();
      const previewValue = previewModel.getValue();

      if (marker.changeId) {
        previewModel.setValue(
          getFileContent({
            upToChangeId: marker.changeId,
            excludeChange: true,
            changes,
            changesOrder,
          })
        );
      } else if (modifiedValue !== previewValue) {
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
        const deltaIns = removeDeletions(marker.delta);
        const deltaDel = removeInserts(marker.delta);
        const editsIns = getMonacoEdits(deltaIns, previewModel);
        const editsDel = getMonacoEdits(deltaDel, previewModel);

        if (editsIns.length === 0) return;

        highlightUndo.current = previewModel.applyEdits(editsIns, true);

        decorations.current = editor.current!.deltaDecorations(
          decorations.current,
          [
            ...editsDel.map((edit) => ({
              range: edit.range,
              options: {
                className: 'delete-highlight',
              },
            })),
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
    },
    [changes, changesOrder]
  );

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

    appliedMarkerRef.current = { edits, marker };
    modifiedModel.applyEdits(edits);

    const viewstate = editor.current?.saveViewState();
    editor.current?.setModel(modifiedModel);
    if (viewstate) {
      editor.current?.restoreViewState(viewstate);
    }
  }, []);

  return (
    <Split
      className="split-editor"
      direction="horizontal"
      sizes={[70, 30]}
      minSize={200}
      gutterSize={1}
    >
      <div>
        <div
          ref={monacoDom}
          className="monaco edit-mode"
          style={{ height: 'calc(100% - 20px)' }}
        ></div>
        <div className="editor-statusbar" style={{ height: 20 }}>
          <div className="path">{activeFile?.path}</div>
        </div>
      </div>
      <div className="diff-markers-wrap">
        {markerIds.map((markerId) => {
          const marker = diffMarkers[markerId];

          return (
            <DiffMarkerButton
              key={markerId}
              marker={marker}
              onMouseEnter={() => {
                activateDiffMarker(marker);
              }}
              onMouseLeave={() => {
                resetDiffMarkers();
              }}
              onClick={() => {
                applyDiffMarker(marker);
              }}
            />
          );
        })}
      </div>
    </Split>
  );
}

function DiffMarkerButton({
  marker,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  marker: DiffMarker;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}) {
  const markerType = isIndentMarker(marker) ? 'indent' : marker.operation;

  return (
    <div
      className={`diff-marker ${marker.changeId ? 'applied' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={marker.changeId ? undefined : onClick}
      style={{ cursor: marker.changeId ? 'default' : 'pointer' }}
    >
      <div className="head">
        <div className="operation">
          <span className={`dot ${markerType}`}></span>
          <span className="text">{markerType}</span>
        </div>
        <span className="stat">
          <span className="additions">+{marker.stat[0]}</span>
          <span className="deletions">-{marker.stat[1]}</span>
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
}
