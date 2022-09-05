import { useAtom } from 'jotai';
import * as monaco from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';

import { activeChangeIdAtom, highlightChangeIndexAtom } from '../atoms/changes';
import { monacoThemeRef } from '../atoms/layout';
import { notesAtom, saveActiveNoteValAtom } from '../atoms/notes';

export const notesModel = monaco.editor.createModel('', 'markdown');

export function WriteNotes() {
  const standaloneEditor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const monacoDom = useRef<HTMLDivElement>(null);
  const [highlightChangeIndex] = useAtom(highlightChangeIndexAtom);
  const [showPlaceholder, setShowPlaceholder] = useState(
    Boolean(!notesModel.getValue())
  );
  const [activeChangeId] = useAtom(activeChangeIdAtom);
  const [, saveActiveNoteVal] = useAtom(saveActiveNoteValAtom);
  const [notes] = useAtom(notesAtom);

  useEffect(() => {
    const newValue = !activeChangeId ? '' : notes[activeChangeId] || '';
    const currValue = notesModel.getValue();

    if (newValue !== currValue) {
      notesModel.setValue(newValue);
    }

    if (newValue) {
      setShowPlaceholder(false);
    } else {
      setShowPlaceholder(true);
    }
  }, [activeChangeId, notes, setShowPlaceholder]);

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
