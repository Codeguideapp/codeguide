import { message } from 'antd';
import * as monaco from 'monaco-editor';
import { useEffect, useRef } from 'react';

import { useChangesStore } from '../store/changes';
import { FileNode } from '../store/files';
import { modifiedModel } from '../utils/monaco';
import { useHighlight } from './useHighlight';

export function EditorPreviewFile({ activeFile }: { activeFile: FileNode }) {
  const selectionListener = useRef<monaco.IDisposable>();
  const editorDom = useRef<HTMLDivElement>(null);
  const standaloneEditor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const saveHighlight = useHighlight();
  const savedChangesLength = useChangesStore(
    (s) => Object.values(s.changes).filter((c) => !c.isDraft).length
  );

  useEffect(() => {
    if (!editorDom.current) return;
    if (!standaloneEditor.current) return;

    standaloneEditor.current.setSelection(new monaco.Selection(0, 0, 0, 0));
  }, [savedChangesLength]);

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
