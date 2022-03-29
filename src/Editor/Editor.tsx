import { createMutex } from 'lib0/mutex';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { getFiles } from '../api/api';
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
  const editorStandaloneDom = useRef<HTMLDivElement>(null);
  const standaloneEditor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const diffEditor = useRef<monaco.editor.IDiffEditor>();
  const decorations = useRef<string[]>([]);
  const standaloneViewstate = useRef<monaco.editor.ICodeEditorViewState | null>(
    null
  );
  const diffViewstate = useRef<monaco.editor.IDiffEditorViewState | null>(null);

  const mux = useRef(createMutex());
  const activeChangeId = useStore((state) => state.activeChangeId);
  const changes = useStore((state) => state.changes);
  const activeChange = useMemo(
    () => (activeChangeId ? changes[activeChangeId] : undefined),
    [activeChangeId, changes]
  );
  const updateStore = useStore(useCallback((state) => state.updateStore, []));
  const getContentForChangeId = useStore(
    useCallback((state) => state.getContentForChangeId, [])
  );

  useEffect(() => {
    const setOriginalVal = async () => {
      if (!activeChange) return;
      const files = await getFiles(0);
      const file = files.find((f) => f.path === activeChange.path);

      if (file) {
        originalModel.setValue(file.newVal);
      }
    };
    setOriginalVal();
  }, [activeChange]);

  useEffect(() => {
    if (!editorDiffDom.current) return;
    if (!editorStandaloneDom.current) return;
    if (!activeChange) return;

    if (standaloneEditor.current) {
      standaloneViewstate.current = standaloneEditor.current.saveViewState();
    }
    if (diffEditor.current) {
      diffViewstate.current = diffEditor.current.saveViewState();
    }

    if (activeChange.isDraft) {
      diffEditor.current?.dispose();
      diffListener.current?.dispose();
      diffMouseDownListener.current?.dispose();

      diffEditor.current = window.monaco.editor.createDiffEditor(
        editorDiffDom.current,
        {
          automaticLayout: true,
          theme: 'vs-dark',
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

      if (diffViewstate.current) {
        diffEditor.current.restoreViewState(diffViewstate.current);
      }

      diffMouseDownListener.current = diffEditor.current
        .getModifiedEditor()
        .onMouseDown(diffGutterMouseHandler(diffEditor));
    } else {
      standaloneEditor.current?.dispose();

      standaloneEditor.current = window.monaco.editor.create(
        editorStandaloneDom.current,
        {
          model: modifiedModel,
          automaticLayout: true,
          theme: 'vs-dark',
          readOnly: true,
        }
      );

      if (standaloneViewstate.current) {
        standaloneEditor.current.restoreViewState(standaloneViewstate.current);
      }
    }
  }, [editorDiffDom, activeChange]);

  useEffect(() => {
    modifiedContentListener.current?.dispose();
    const content = activeChange ? getContentForChangeId(activeChange.id) : '';

    modifiedModel.setValue(content);

    if (activeChange?.isDraft) {
      modifiedContentListener.current = modifiedModel.onDidChangeContent(
        (e) => {
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
                changes[activeChange.id].delta =
                  changes[activeChange.id].delta.compose(delta);
              });
            });
          });
        }
      );
    }
  }, [activeChange, updateStore, getContentForChangeId]);

  return (
    <div
      style={{
        overflow: 'hidden',
        width: '100%',
        height: '100%',
      }}
    >
      <div
        ref={editorDiffDom}
        style={{
          display: activeChange?.isDraft ? 'block' : 'none',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
        }}
      ></div>
      <div
        ref={editorStandaloneDom}
        style={{
          display: activeChange?.isDraft ? 'none' : 'block',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
        }}
      ></div>
    </div>
  );
}
