import { createMutex } from 'lib0/mutex';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useCallback, useEffect, useRef } from 'react';
import Split from 'react-split';

import { Command } from '../edits';
import { useStore } from '../store/store';
import { applyCommand, highlightCommand } from './monacoUtils';
import { Suggestions } from './Suggestions';

export function Editor() {
  const monacoListener = useRef<monaco.IDisposable>({ dispose: () => {} });
  const editorDiv = useRef<HTMLDivElement>(null);
  const decorations = useRef<string[]>([]);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const mux = useRef(createMutex());
  const activeChangeId = useStore((state) => state.activeChangeId);
  const activeChangeValue = useStore((state) => state.activeChangeValue);
  const updateStore = useStore(useCallback((state) => state.updateStore, []));
  const updateSuggestions = useStore(
    useCallback((state) => state.updateSuggestions, [])
  );

  const undoHighlight = useRef<Command>();

  const hideSuggestion = useCallback(() => {
    mux.current(() => {
      if (!undoHighlight.current) return;
      if (!editor.current) return;

      decorations.current = editor.current.deltaDecorations(
        decorations.current,
        []
      );

      applyCommand(undoHighlight.current, editor.current);
      undoHighlight.current = undefined;
    });
  }, []);

  const applySuggestion = useCallback(
    (suggestion: Command) => {
      hideSuggestion();
      if (!editor.current) return;

      applyCommand(suggestion, editor.current);
      updateSuggestions(editor.current.getValue());
    },
    [updateSuggestions, hideSuggestion]
  );

  const showSuggestion = useCallback(
    (suggestion: Command) => {
      if (undoHighlight.current) {
        hideSuggestion();
      }

      mux.current(() => {
        if (!editor.current) return;
        undoHighlight.current = highlightCommand(
          suggestion,
          editor.current,
          decorations
        );
      });
    },
    [hideSuggestion]
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
        mux.current(() => {
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
      });
    }
  }, [activeChangeId, activeChangeValue, updateStore, updateSuggestions]);

  return (
    <Split
      className="split-main"
      gutterSize={5}
      snapOffset={10}
      sizes={[70, 30]}
      minSize={[100, 100]}
    >
      <div
        ref={editorDiv}
        id="editor"
        style={{
          width: '100%',
          height: '100%',
        }}
      ></div>
      <Suggestions
        showSuggestion={showSuggestion}
        hideSuggestion={hideSuggestion}
        applySuggestion={applySuggestion}
      />
    </Split>
  );
}
