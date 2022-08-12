import { useAtom } from 'jotai';
import { findLast, isEqual } from 'lodash';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Split from 'react-split';

import { DiffMarker, DiffMarkers } from '../api/diffMarkers';
import { changesAtom, changesOrderAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { selectionsAtom } from '../atoms/monaco';
import { appliedMarkersAtom, saveDeltaAtom } from '../atoms/saveDeltaAtom';
import { composeDeltas } from '../utils/deltaUtils';
import { getFileContent } from '../utils/getFileContent';
import { modifiedModel, originalModel, previewModel } from '../utils/monaco';
import { DiffMarkersList } from './DiffMarkers';

export function EditorEditStepByStep() {
  const modifiedContentListener = useRef<monaco.IDisposable>();
  const diffListener = useRef<monaco.IDisposable>();
  const diffMouseDownListener = useRef<monaco.IDisposable>();
  const selectionListener = useRef<monaco.IDisposable>();
  const [, setSelections] = useAtom(selectionsAtom);
  const monacoDom = useRef<HTMLDivElement>(null);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const [activeFile] = useAtom(activeFileAtom);
  const [, saveDelta] = useAtom(saveDeltaAtom);
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [appliedMarkers] = useAtom(appliedMarkersAtom);
  const appliedMarkerRef = useRef<{
    edits: monaco.editor.IIdentifiedSingleEditOperation[];
    marker: DiffMarker;
  }>();

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
      glyphMargin: false,
      smoothScrolling: true,
      tabSize: 2,

      //wordWrap: 'on',
    });

    editor.current.setModel(modifiedModel);

    return () => {
      editor.current?.dispose();
      modifiedContentListener.current?.dispose();
      selectionListener.current?.dispose();
      setSelections([]);
      modifiedModel.setValue('');
      originalModel.setValue('');
    };
  }, [monacoDom, setSelections]);

  useEffect(() => {
    modifiedContentListener.current?.dispose();
    selectionListener.current?.dispose();
    setSelections([]);

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

    const markers = activeFile.diffMarkers;

    setDiffMarkers({
      ...markers,
      ...appliedMarkers
        .filter((m) => m.path === activeFile.path)
        .reduce((acc, curr) => {
          return {
            ...acc,
            [curr.id]: curr,
          };
        }, {} as DiffMarkers),
    });

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

    selectionListener.current = editor.current?.onDidChangeCursorSelection(
      (e) => {
        setSelections(
          [e.selection, ...e.secondarySelections].filter(
            (sel) =>
              sel.startLineNumber !== sel.endLineNumber ||
              sel.startColumn !== sel.endColumn
          )
        );
      }
    );
  }, [
    activeFile,
    changesOrder,
    appliedMarkers,
    saveDelta,
    setDiffMarkers,
    setSelections,
  ]); // not watching changes as dep, because it is covered by changesOrder

  return (
    <div style={{ height: 'calc(100% - 50px)' }}>
      <Split
        className="split-editor"
        direction="horizontal"
        sizes={[25, 75]}
        minSize={250}
        gutterSize={1}
      >
        <DiffMarkersList
          appliedMarkerRef={appliedMarkerRef}
          diffMarkers={diffMarkers}
          markerIds={markerIds}
          modifiedModel={modifiedModel}
          previewModel={previewModel}
          editor={editor.current}
        />
        <div style={{ position: 'relative' }}>
          <div
            ref={monacoDom}
            className="monaco edit-mode"
            style={{ height: '100%' }}
          ></div>
        </div>
      </Split>
      <div className="editor-statusbar" style={{ height: 20 }}>
        <div className="path">{activeFile?.path}</div>
      </div>
    </div>
  );
}
