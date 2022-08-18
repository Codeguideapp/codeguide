import classNames from 'classnames';
import { atom, useAtom } from 'jotai';
import * as monaco from 'monaco-editor';
import { useCallback, useRef } from 'react';

import { DiffMarker, DiffMarkers } from '../api/diffMarkers';
import { changesAtom, changesOrderAtom } from '../atoms/changes';
import {
  getMonacoEdits,
  removeDeletions,
  removeInserts,
} from '../utils/monaco';

const markerStepAtom = atom(0);
const activeMarkerAtom = atom('');

export function DiffMarkersList({
  markerIds,
  diffMarkers,
  editor,
  previewModel,
  modifiedModel,
  appliedMarkerRef,
}: {
  markerIds: string[];
  diffMarkers: DiffMarkers;
  editor?: monaco.editor.ICodeEditor;
  previewModel: monaco.editor.ITextModel;
  modifiedModel: monaco.editor.ITextModel;
  appliedMarkerRef: React.MutableRefObject<
    | {
        edits: monaco.editor.IIdentifiedSingleEditOperation[];
        marker: DiffMarker;
      }
    | undefined
  >;
}) {
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const decorations = useRef<string[]>([]);
  const highlightUndo = useRef<
    {
      range: monaco.Range;
      text: string;
    }[]
  >([]);

  const activateDiffMarker = useCallback(
    (marker: DiffMarker, step?: number) => {
      const viewstate = editor?.saveViewState();

      editor?.updateOptions({
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
      editor?.setModel(previewModel);

      if (viewstate) {
        editor?.restoreViewState(viewstate);
      }

      if (marker.operation === 'delete') {
        const edits = getMonacoEdits(marker.delta, previewModel);
        decorations.current = editor!.deltaDecorations(
          decorations.current,
          edits.map((edit) => ({
            range: edit.range,
            options: {
              className: 'delete-highlight delete-cursor',
            },
          }))
        );
        editor?.revealRangeInCenterIfOutsideViewport(
          edits[0].range,
          monaco.editor.ScrollType.Smooth
        );
      } else if (marker.operation === 'replace') {
        if (step === 2) {
          const deltaDel = removeInserts(marker.delta);
          const editsDel = getMonacoEdits(deltaDel, previewModel);
          const deltaIns = removeDeletions(marker.delta);
          const editsIns = getMonacoEdits(deltaIns, previewModel);

          previewModel.applyEdits(editsDel);

          if (editsIns.length === 0) return;

          highlightUndo.current = previewModel.applyEdits(editsIns, true);

          decorations.current = editor!.deltaDecorations(decorations.current, [
            ...highlightUndo.current.map((edit) => ({
              range: edit.range,
              options: {
                className: 'insert-highlight insert-cursor',
              },
            })),
          ]);

          const startRange = highlightUndo.current[0].range;
          const endRange =
            highlightUndo.current[highlightUndo.current.length - 1].range;

          editor?.revealRangeInCenterIfOutsideViewport(
            new monaco.Range(
              startRange.startLineNumber,
              startRange.startColumn,
              endRange.endLineNumber,
              endRange.endColumn
            ),
            monaco.editor.ScrollType.Smooth
          );
        } else {
          const deltaDel = removeInserts(marker.delta);
          const editsDel = getMonacoEdits(deltaDel, previewModel);

          decorations.current = editor!.deltaDecorations(decorations.current, [
            ...editsDel.map((edit) => ({
              range: edit.range,
              options: {
                className: 'delete-highlight delete-cursor',
              },
            })),
          ]);

          const startRange = editsDel[0].range;
          const endRange = editsDel[editsDel.length - 1].range;

          editor?.revealRangeInCenterIfOutsideViewport(
            new monaco.Range(
              startRange.startLineNumber,
              startRange.startColumn,
              endRange.endLineNumber,
              endRange.endColumn
            ),
            monaco.editor.ScrollType.Smooth
          );
        }
      } else {
        const edits = getMonacoEdits(marker.delta, previewModel);
        if (edits.length === 0) return;

        highlightUndo.current = previewModel.applyEdits(edits, true);

        decorations.current = editor!.deltaDecorations(
          decorations.current,
          highlightUndo.current.map((edit) => ({
            range: edit.range,
            options: {
              className: 'insert-highlight insert-cursor',
            },
          }))
        );

        const startRange = highlightUndo.current[0].range;
        const endRange =
          highlightUndo.current[highlightUndo.current.length - 1].range;

        editor?.revealRangeInCenterIfOutsideViewport(
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
    [changes, changesOrder, editor, modifiedModel, previewModel]
  );

  const resetDiffMarkers = useCallback(() => {
    previewModel.applyEdits(highlightUndo.current);
    highlightUndo.current = [];

    const viewstate = editor?.saveViewState();
    editor?.setModel(modifiedModel);
    if (viewstate) {
      editor?.restoreViewState(viewstate);
    }

    const modifiedValue = modifiedModel.getValue();
    const previewValue = previewModel.getValue();
    if (modifiedValue !== previewValue) {
      previewModel.setValue(modifiedValue);
    }

    editor?.updateOptions({
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
      },
    });
  }, [editor, modifiedModel, previewModel]);

  const applyDiffMarker = useCallback(
    (marker: DiffMarker) => {
      const edits = getMonacoEdits(marker.delta, modifiedModel);

      appliedMarkerRef.current = { edits, marker };
      modifiedModel.applyEdits(edits);

      const viewstate = editor?.saveViewState();
      editor?.setModel(modifiedModel);
      if (viewstate) {
        editor?.restoreViewState(viewstate);
      }
    },
    [appliedMarkerRef, editor, modifiedModel]
  );

  const [markerStep, setMarkerStep] = useAtom(markerStepAtom);
  const [, setActiveMarker] = useAtom(activeMarkerAtom);

  return (
    <div className="diff-markers-wrap">
      {markerIds.map((markerId) => {
        const marker = diffMarkers[markerId];

        return (
          <DiffMarkerButton
            key={markerId}
            marker={marker}
            onMouseEnter={() => {
              if (marker.changeId) return;

              setMarkerStep(1);
              setActiveMarker(marker.id);
              activateDiffMarker(marker);
            }}
            onMouseLeave={() => {
              if (marker.changeId) return;

              setMarkerStep(0);
              setActiveMarker('');
              resetDiffMarkers();
            }}
            onClick={() => {
              if (marker.changeId) return;

              if (marker.operation === 'replace' && markerStep !== 2) {
                setMarkerStep(2);
                activateDiffMarker(marker, 2);
              } else {
                setMarkerStep(0);
                applyDiffMarker(marker);
              }
            }}
          />
        );
      })}
    </div>
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
  const [markerStep] = useAtom(markerStepAtom);
  const [activeMarker] = useAtom(activeMarkerAtom);

  const isApplied = marker.changeId;
  const markerType = marker.type ? marker.type : marker.operation;
  const totalChars = marker.stat[0] + marker.stat[1];
  return (
    <div
      className={classNames(
        {
          'diff-marker': true,
          applied: isApplied,
          active: !isApplied && activeMarker === marker.id,
          'highlight-delete':
            activeMarker === marker.id &&
            marker.operation === 'replace' &&
            markerStep === 1,
          'highlight-insert':
            activeMarker === marker.id &&
            marker.operation === 'replace' &&
            markerStep === 2,
        },
        markerType
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={isApplied ? undefined : onClick}
      style={{ cursor: isApplied ? 'default' : 'pointer' }}
    >
      <div className="code-preview">
        {Object.entries(marker.preview || {}).map(([line, content]) => (
          <div key={line}>
            <span className="linenumber">{line}:</span>
            {content.map((c, i) => {
              return (
                <span
                  key={`${line}-${i}`}
                  className={classNames({
                    code: true,
                    deleted: c.isDelete,
                  })}
                >
                  {c.code}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="bottom">
        <div className="line">
          <span
            className="insert"
            style={{ width: `${(marker.stat[0] / totalChars) * 100}%` }}
          ></span>
          <span
            className="delete"
            style={{ width: `${(marker.stat[1] / totalChars) * 100}%` }}
          ></span>
        </div>
        <span className="stat">
          <span className="additions">+{marker.stat[0]}</span>
          <span className="deletions">-{marker.stat[1]}</span>
        </span>
      </div>
    </div>
  );
}
