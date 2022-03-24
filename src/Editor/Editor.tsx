import { createMutex } from 'lib0/mutex';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useCallback, useEffect, useRef } from 'react';

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

  const mux = useRef(createMutex());
  const activeChangeId = useStore((state) => state.activeChangeId);
  const activeChangeValue = useStore((state) => state.activeChangeValue);
  const activeResultValue = useStore((state) => state.activeResultValue);
  const updateStore = useStore(useCallback((state) => state.updateStore, []));

  useEffect(() => {
    originalModel.setValue(activeResultValue);
  }, [activeResultValue]);

  useEffect(() => {
    if (!editorDiffDom.current) return;
    if (!editorStandaloneDom.current) return;

    if (activeChangeId === 'draft') {
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
    }
  }, [editorDiffDom, activeChangeId]);

  useEffect(() => {
    modifiedContentListener.current?.dispose();
    modifiedModel.setValue(activeChangeValue);

    if (activeChangeId === 'draft') {
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
                changes.draft.delta = changes.draft.delta.compose(delta);
              });
            });
          });
        }
      );
    }
  }, [activeChangeId, activeChangeValue, updateStore]);

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
          display: activeChangeId === 'draft' ? 'block' : 'none',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
        }}
      ></div>
      <div
        ref={editorStandaloneDom}
        style={{
          display: activeChangeId === 'draft' ? 'none' : 'block',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
        }}
      ></div>
    </div>
  );
}
