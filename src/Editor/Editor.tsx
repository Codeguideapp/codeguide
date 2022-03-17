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
  const updateStore = useStore(useCallback((state) => state.updateStore, []));
  const updateSuggestions = useStore(
    useCallback((state) => state.updateSuggestions, [])
  );

  useEffect(() => {
    if (editorDiv.current) {
      const readOnly = activeChangeId !== 'draft';

      editor.current = window.monaco.editor.create(editorDiv.current, {
        value: '',
        language: 'javascript',
        readOnly: readOnly,
        theme: readOnly ? 'readonly' : 'vs-dark',
        automaticLayout: true,
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

          updateStore(({ changes }) => {
            changes.draft.delta = changes.draft.delta.compose(delta);
          });
        });

        updateSuggestions(editor.current!.getValue());
      });
    }
  }, [activeChangeId, activeChangeValue, updateStore, updateSuggestions]);

  return (
    <div
      ref={editorDiv}
      id="editor"
      style={{
        width: '100%',
        height: '100%',
      }}
    ></div>
  );
}
