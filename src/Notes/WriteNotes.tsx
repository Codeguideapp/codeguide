import { useAtom } from 'jotai';
import * as monaco from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';

import { highlightChangeIndexAtom } from '../atoms/changes';

export const notesModel = monaco.editor.createModel('', 'markdown');

export function WriteNotes() {
  const standaloneEditor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const monacoDom = useRef<HTMLDivElement>(null);
  const [highlightChangeIndex] = useAtom(highlightChangeIndexAtom);
  const [showPlaceholder, setShowPlaceholder] = useState(
    Boolean(!notesModel.getValue())
  );

  useEffect(() => {
    if (!monacoDom.current) return;

    standaloneEditor.current = monaco.editor.create(monacoDom.current, {
      automaticLayout: true,
      theme: 'darkTheme',
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
  }, [monacoDom]);

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
