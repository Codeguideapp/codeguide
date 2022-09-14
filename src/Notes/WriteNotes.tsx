import { useAtom } from 'jotai';
import * as monaco from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';

import { highlightChangeIndexAtom } from '../atoms/changes';
import { monacoThemeRef } from '../atoms/layout';
import { saveActiveNoteValAtom } from '../atoms/notes';

export const notesModel = monaco.editor.createModel('', 'markdown');

export function WriteNotes({ value }: { value: string }) {
  const standaloneEditor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const monacoDom = useRef<HTMLDivElement>(null);
  const [highlightChangeIndex] = useAtom(highlightChangeIndexAtom);
  const [showPlaceholder, setShowPlaceholder] = useState(
    Boolean(!notesModel.getValue())
  );
  const [, saveActiveNoteVal] = useAtom(saveActiveNoteValAtom);

  useEffect(() => {
    const currValue = notesModel.getValue();

    if (value !== currValue) {
      notesModel.setValue(value);
    }

    if (value) {
      setShowPlaceholder(false);
    } else {
      setShowPlaceholder(true);
    }
  }, [value, setShowPlaceholder]);

  useEffect(() => {
    if (!monacoDom.current) return;

    standaloneEditor.current = monaco.editor.create(monacoDom.current, {
      automaticLayout: true,
      theme: monacoThemeRef.current,
      minimap: {
        enabled: false,
      },
      lineNumbers: 'off',
      cursorStyle: 'line-thin',
      renderLineHighlight: 'none',
      contextmenu: false,
      folding: false,
      model: notesModel,
    });

    standaloneEditor.current.onDidBlurEditorWidget(() => {
      if (!notesModel.getValue()) {
        setShowPlaceholder(true);
      }
    });

    standaloneEditor.current.onDidFocusEditorWidget(() => {
      setShowPlaceholder(false);
    });

    const onChangeListener = notesModel.onDidChangeContent((e) => {
      saveActiveNoteVal(notesModel.getValue());
    });

    return () => {
      onChangeListener.dispose();
    };
  }, [monacoDom, saveActiveNoteVal]);

  return (
    <div className="body">
      <div ref={monacoDom} className="monaco"></div>
      <div
        style={{ display: showPlaceholder ? 'block' : 'none' }}
        className="placeholder"
      >
        Write a note/explanation for step {highlightChangeIndex || 0 + 1}{' '}
        (optional)
      </div>
    </div>
  );
}
