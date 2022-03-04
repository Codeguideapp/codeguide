// save draft pa se stvori novi change
// use immer https://github.com/pmndrs/zustand#sick-of-reducers-and-changing-nested-state-use-immer

import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useCallback, useEffect, useRef } from 'react';

import { useStore } from '../store/store';

export function Editor() {
  const monacoListener = useRef<monaco.IDisposable>({ dispose: () => {} });
  const editorDiv = useRef<HTMLDivElement>(null);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const activeChangeId = useStore((state) => state.activeChangeId);
  const activeChangeValue = useStore((state) => state.activeChangeValue);
  const saveChanges2 = useStore(useCallback((state) => state.saveChanges2, []));

  useEffect(() => {
    if (editorDiv.current) {
      const readOnly = activeChangeId !== 'draft';

      editor.current = window.monaco.editor.create(editorDiv.current, {
        value: '',
        language: 'javascript',
        readOnly: readOnly,
        theme: readOnly ? 'readonly' : 'vs-dark',
      });
    }
  }, [editorDiv]);

  useEffect(() => {
    if (!editor.current) return;

    const readOnly = activeChangeId !== 'draft';

    editor.current.updateOptions({
      readOnly: readOnly,
      theme: readOnly ? 'readonly' : 'vs-dark',
    });
  }, [activeChangeId]);

  useEffect(() => {
    monacoListener.current.dispose();
    if (!editor.current) return;
    const monacoModel = editor.current.getModel();
    if (!monacoModel) return;

    editor.current.setValue(activeChangeValue);

    if (activeChangeId === 'draft') {
      monacoListener.current = monacoModel.onDidChangeContent((e) => {
        e.changes.forEach((change) => {
          const delta = new Delta();
          if (change.rangeOffset > 0) {
            delta.retain(change.rangeOffset);
          }
          if (change.rangeLength) {
            delta.delete(change.rangeLength);
          }
          if (change.text) {
            delta.insert(change.text);
          }

          saveChanges2((store) => {
            store.changes.draft.delta =
              store.changes.draft.delta.compose(delta);
          });
        });
      });
    }
  }, [activeChangeId, activeChangeValue, saveChanges2]);

  return (
    <div
      ref={editorDiv}
      id="editor"
      style={{
        width: 800,
        height: 400,
      }}
    ></div>
  );
}