import * as monaco from 'monaco-editor';
import React, { useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';

import { useStore } from '../store/store';
import { modifiedModel, originalModel } from './monacoUtils';

export function EditorReadMode() {
  const editorDiffDom = useRef<HTMLDivElement>(null);
  const diffEditor = useRef<monaco.editor.IDiffEditor>();
  const activeChangeId = useStore((state) => state.activeChangeId);
  const getDiffByChangeId = useStore(
    useCallback((state) => state.getDiffByChangeId, [])
  );
  const { data } = useSWR(activeChangeId, getDiffByChangeId);

  useEffect(() => {
    // initializing editor
    if (!editorDiffDom.current) return;

    diffEditor.current?.dispose();

    diffEditor.current = window.monaco.editor.createDiffEditor(
      editorDiffDom.current,
      {
        automaticLayout: true,
        theme: 'defaultDark',
        originalEditable: false,
        readOnly: true,
        ignoreTrimWhitespace: false,
      }
    );

    diffEditor.current.setModel({
      original: modifiedModel,
      modified: originalModel,
    });

    return () => {
      diffEditor.current?.dispose();
    };
  }, [editorDiffDom]);

  useEffect(() => {
    if (!data) {
      originalModel.setValue('loading...');
      modifiedModel.setValue('loading...');
      return;
    }

    originalModel.setValue(data.after);
    modifiedModel.setValue(data.before);
  }, [data]);

  return <div ref={editorDiffDom} className={'monaco-preview'}></div>;
}
