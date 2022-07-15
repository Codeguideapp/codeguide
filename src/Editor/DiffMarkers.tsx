import { useAtom } from 'jotai';
import * as monaco from 'monaco-editor';
import { useCallback, useRef } from 'react';

import { DiffMarker, DiffMarkers } from '../api/diffMarkers';
import { changesAtom, changesOrderAtom } from '../atoms/changes';
import { getFileContent } from '../utils/getFileContent';
import {
  getMonacoEdits,
  removeDeletions,
  removeInserts,
} from '../utils/monaco';

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
  editor?: monaco.editor.IStandaloneCodeEditor;
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
    (marker: DiffMarker) => {
      const viewstate = editor?.saveViewState();

      editor?.updateOptions({
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
              className: 'delete-highlight',
            },
          }))
        );
        editor?.revealRangeInCenterIfOutsideViewport(
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

        decorations.current = editor!.deltaDecorations(decorations.current, [
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
        const edits = getMonacoEdits(marker.delta, previewModel);
        if (edits.length === 0) return;

        highlightUndo.current = previewModel.applyEdits(edits, true);

        decorations.current = editor!.deltaDecorations(
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

  return (
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
  const markerType = marker.type ? marker.type : marker.operation;

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
