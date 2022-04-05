import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';

import { composeDeltas } from '../store/deltaUtils';
import { useStore } from '../store/store';
import {
  diffGutterMouseHandler,
  modifiedModel,
  originalModel,
} from './monacoUtils';

export function EditorEditMode() {
  const modifiedContentListener = useRef<monaco.IDisposable>();
  const diffListener = useRef<monaco.IDisposable>();
  const diffMouseDownListener = useRef<monaco.IDisposable>();
  const editorDiffDom = useRef<HTMLDivElement>(null);
  const diffEditor = useRef<monaco.editor.IDiffEditor>();
  const decorations = useRef<string[]>([]);
  const activePath = useStore((state) => state.activePath);
  const saveChange = useStore(useCallback((state) => state.saveChange, []));
  const getDiffByPath = useStore(
    useCallback((state) => state.getDiffByPath, [])
  );

  const { data } = useSWR(activePath, getDiffByPath);

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

    return () => {
      diffEditor.current?.dispose();
      diffListener.current?.dispose();
      diffMouseDownListener.current?.dispose();
      modifiedContentListener.current?.dispose();
    };
  }, [editorDiffDom]);

  useEffect(() => {
    modifiedContentListener.current?.dispose();

    if (!activePath) {
      originalModel.setValue('');
      modifiedModel.setValue('');
      return;
    }

    if (!data) {
      originalModel.setValue('loading...');
      modifiedModel.setValue('loading...');
      return;
    }

    originalModel.setValue(data.after);
    modifiedModel.setValue(data.before);

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
  }, [data, activePath, saveChange]);

  return <div ref={editorDiffDom} className={'monaco-edit'}></div>;
}
