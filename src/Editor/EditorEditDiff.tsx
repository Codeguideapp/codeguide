import { useAtom } from 'jotai';
import { findLast } from 'lodash';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useEffect, useRef } from 'react';

import { changesAtom, changesOrderAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { selectionsAtom } from '../atoms/monaco';
import { showWhitespaceAtom } from '../atoms/options';
import { saveDeltaAtom } from '../atoms/saveDeltaAtom';
import { composeDeltas } from '../utils/deltaUtils';
import { getFileContent } from '../utils/getFileContent';
import { modifiedModel, originalModel, previewModel } from '../utils/monaco';

export function EditorEditDiff() {
  const modifiedContentListener = useRef<monaco.IDisposable>();
  const selectionListener = useRef<monaco.IDisposable>();
  const [, setSelections] = useAtom(selectionsAtom);
  const editorDiffDom = useRef<HTMLDivElement>(null);
  const diffEditor = useRef<monaco.editor.IDiffEditor>();
  const [activeFile] = useAtom(activeFileAtom);
  const [, saveDelta] = useAtom(saveDeltaAtom);
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [showWhitespace] = useAtom(showWhitespaceAtom);

  useEffect(() => {
    // initializing editor
    if (!editorDiffDom.current) return;

    diffEditor.current?.dispose();

    diffEditor.current = monaco.editor.createDiffEditor(editorDiffDom.current, {
      automaticLayout: true,
      theme: 'darkInvertedDiff',
      //originalEditable: true,
      //readOnly: false,
      glyphMargin: true,
      ignoreTrimWhitespace: !showWhitespace,
    });

    diffEditor.current.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    return () => {
      diffEditor.current?.dispose();
      selectionListener.current?.dispose();
      modifiedContentListener.current?.dispose();
      setSelections([]);
      modifiedModel.setValue('');
      originalModel.setValue('');
    };
  }, [editorDiffDom, setSelections]);

  useEffect(() => {
    // initializing editor
    if (!diffEditor.current) return;

    diffEditor.current.updateOptions({
      ignoreTrimWhitespace: !showWhitespace,
    });
  }, [showWhitespace]);

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

    modifiedContentListener.current = modifiedModel.onDidChangeContent((e) => {
      const deltas: Delta[] = [];

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

    selectionListener.current = diffEditor.current
      ?.getModifiedEditor()
      .onDidChangeCursorSelection((e) => {
        setSelections(
          [e.selection, ...e.secondarySelections].filter(
            (sel) =>
              sel.startLineNumber !== sel.endLineNumber ||
              sel.startColumn !== sel.endColumn
          )
        );
      });
  }, [activeFile, changesOrder, saveDelta, setSelections]); // not watching changes as dep, because it is covered by changesOrder

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div
        ref={editorDiffDom}
        className="monaco edit-mode"
        style={{ height: '100%' }}
      ></div>
    </div>
  );
}
