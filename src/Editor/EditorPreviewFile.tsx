import * as monaco from 'monaco-editor';
import { useEffect, useRef } from 'react';

import { FileNode } from '../atoms/files';
import { modifiedModel } from '../utils/monaco';
import { useHighlight } from './useHighlight';

export function EditorPreviewFile({ activeFile }: { activeFile: FileNode }) {
  const selectionListener = useRef<monaco.IDisposable>();
  const editorDom = useRef<HTMLDivElement>(null);
  const standaloneEditor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const saveHighlight = useHighlight();

  useEffect(() => {
    // initializing editor
    if (!editorDom.current) return;

    standaloneEditor.current?.dispose();

    standaloneEditor.current = monaco.editor.create(editorDom.current, {
      automaticLayout: true,
      theme: 'darkInvertedDiff',
      glyphMargin: true,
      model: modifiedModel,
      readOnly: true,
    });

    selectionListener.current =
      standaloneEditor.current?.onDidChangeCursorSelection((e) => {
        saveHighlight(
          [e.selection, ...e.secondarySelections].filter(
            (sel) =>
              sel.startLineNumber !== sel.endLineNumber ||
              sel.startColumn !== sel.endColumn
          )
        );
      });

    return () => {
      standaloneEditor.current?.dispose();
      selectionListener.current?.dispose();
    };
  }, [editorDom, saveHighlight]);

  useEffect(() => {
    modifiedModel.setValue(activeFile.newVal);
  }, [activeFile.newVal]);

  return <div ref={editorDom} className="monaco edit-mode"></div>;
}
