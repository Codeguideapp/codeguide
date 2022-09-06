import { useAtom } from 'jotai';
import { findLast } from 'lodash';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useEffect, useRef } from 'react';

import { changesAtom, changesOrderAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { monacoThemeRef } from '../atoms/layout';
import { showWhitespaceAtom } from '../atoms/options';
import { saveDeltaAtom } from '../atoms/saveDeltaAtom';
import { composeDeltas, getFileContent } from '../utils/deltaUtils';
import { modifiedModel, originalModel, previewModel } from '../utils/monaco';
import { useHighlight } from './useHighlight';

export function EditorEditDiff() {
  const modifiedContentListener = useRef<monaco.IDisposable>();
  const selectionListener = useRef<monaco.IDisposable>();
  const editorDiffDom = useRef<HTMLDivElement>(null);
  const diffEditor = useRef<monaco.editor.IDiffEditor>();
  const [activeFile] = useAtom(activeFileAtom);
  const [, saveDelta] = useAtom(saveDeltaAtom);
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [showWhitespace] = useAtom(showWhitespaceAtom);
  const saveHighlight = useHighlight();

  useEffect(() => {
    // initializing editor
    if (!editorDiffDom.current) return;

    diffEditor.current?.dispose();

    monacoThemeRef.current = 'darkInvertedDiff';
    diffEditor.current = monaco.editor.createDiffEditor(editorDiffDom.current, {
      automaticLayout: true,
      theme: monacoThemeRef.current,
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
      modifiedModel.setValue('');
      originalModel.setValue('');
    };
  }, [editorDiffDom]); // showWhitespace is used only for initialization so it is not included in dep

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
        highlight: [],
      });
    });

    selectionListener.current = diffEditor.current
      ?.getModifiedEditor()
      .onDidChangeCursorSelection((e) => {
        saveHighlight(
          [e.selection, ...e.secondarySelections].filter(
            (sel) =>
              sel.startLineNumber !== sel.endLineNumber ||
              sel.startColumn !== sel.endColumn
          )
        );
      });
  }, [activeFile, changesOrder, saveDelta, saveHighlight]); // not watching changes as dep, because it is covered by changesOrder

  return <div ref={editorDiffDom} className="monaco edit-mode"></div>;
}
