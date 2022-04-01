import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useCallback, useEffect, useRef } from 'react';

import { composeDeltas } from '../store/deltaUtils';
import { useStore } from '../store/store';
import {
  diffGutterMouseHandler,
  modifiedModel,
  originalModel,
} from './monacoUtils';

export function Editor() {
  const modifiedContentListener = useRef<monaco.IDisposable>();
  const diffListener = useRef<monaco.IDisposable>();
  const diffMouseDownListener = useRef<monaco.IDisposable>();
  const editorDiffDom = useRef<HTMLDivElement>(null);
  const diffEditor = useRef<monaco.editor.IDiffEditor>();
  const decorations = useRef<string[]>([]);
  const userDefinedOrder = useStore((state) => state.userDefinedOrder);
  const activePath = useStore((state) => state.activePath);
  const files = useStore((state) => state.files);
  const changes = useStore((state) => state.changes);
  const canEdit = useStore((state) => state.canEdit);
  const activeChange = useStore((state) =>
    state.activeChangeId ? state.changes[state.activeChangeId] : undefined
  );
  const saveChange = useStore(useCallback((state) => state.saveChange, []));
  const getFileContent = useStore(
    useCallback((state) => state.getFileContent, [])
  );

  useEffect(() => {
    // initializing editor
    if (!editorDiffDom.current) return;

    diffEditor.current?.dispose();
    diffListener.current?.dispose();
    diffMouseDownListener.current?.dispose();

    diffEditor.current = window.monaco.editor.createDiffEditor(
      editorDiffDom.current,
      {
        automaticLayout: true,
        theme: 'defaultDark',
        originalEditable: true,
        readOnly: true,
        glyphMargin: true,
        ignoreTrimWhitespace: false,
      }
    );

    diffEditor.current.setModel({
      original: modifiedModel,
      modified: originalModel,
    });

    diffListener.current = diffEditor.current.onDidUpdateDiff(() => {
      if (!diffEditor.current) return;

      const modifiedEditor = diffEditor.current.getModifiedEditor();
      const lineChanges = diffEditor.current.getLineChanges() || [];
      const ranges = lineChanges.map(
        (l) =>
          new monaco.Range(
            l.modifiedStartLineNumber,
            0,
            l.modifiedEndLineNumber,
            1
          )
      );

      decorations.current = modifiedEditor.deltaDecorations(
        decorations.current,
        ranges.map((range) => {
          return {
            range,
            options: {
              glyphMarginClassName: 'diffglyph',
            },
          };
        })
      );
    });

    diffMouseDownListener.current = diffEditor.current
      .getModifiedEditor()
      .onMouseDown(diffGutterMouseHandler(diffEditor));
  }, [editorDiffDom]);

  useEffect(() => {
    // edit mode
    if (!canEdit) return;
    if (!activePath) return;

    const file = files.find((f) => f.path === activePath);
    if (!file) {
      throw new Error(`missing file for ${activePath}`);
    }

    modifiedContentListener.current?.dispose();
    monaco.editor.setTheme('defaultDark');
    diffEditor.current?.updateOptions({
      originalEditable: true,
    });

    originalModel.setValue(file.newVal);

    const lastChangeForActivePath = [...userDefinedOrder]
      .reverse()
      .map((id) => changes[id])
      .find((change) => change.path === activePath);

    if (lastChangeForActivePath) {
      const id = lastChangeForActivePath.id;
      modifiedModel.setValue(getFileContent(id));
    } else {
      modifiedModel.setValue(file.oldVal);
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

      saveChange(composeDeltas(deltas));
    });
  }, [
    activePath,
    files,
    canEdit,
    userDefinedOrder,
    changes,
    getFileContent,
    saveChange,
  ]);

  useEffect(() => {
    // read only mode
    if (canEdit) return;
    if (!activeChange) return;

    const file = files.find((f) => f.path === activeChange.path);
    if (!file) {
      throw new Error(`missing file for ${activeChange.path}`);
    }

    modifiedContentListener.current?.dispose();
    monaco.editor.setTheme('readonly');
    diffEditor.current?.updateOptions({
      originalEditable: false,
    });

    originalModel.setValue(getFileContent(activeChange.id));

    const lastChangeForActivePath = userDefinedOrder
      .slice(0, userDefinedOrder.indexOf(activeChange.id))
      .reverse()
      .map((id) => changes[id])
      .find((change) => change.path === activeChange.path);

    if (lastChangeForActivePath) {
      const id = lastChangeForActivePath.id;
      modifiedModel.setValue(getFileContent(id));
    } else {
      modifiedModel.setValue('');
    }
  }, [
    activeChange,
    canEdit,
    userDefinedOrder,
    changes,
    files,
    getFileContent,
    saveChange,
  ]);

  return (
    <div
      ref={editorDiffDom}
      className={canEdit ? 'monaco-edit' : 'monaco-preview'}
    ></div>
  );
}
