import { useAtom } from 'jotai';
import * as monaco from 'monaco-editor';
import React, { useEffect, useRef } from 'react';
import useSWR from 'swr';

import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
} from '../atoms/changes';
import { getDiffByChangeId } from '../utils/diffUtils';
import { modifiedModel, originalModel } from '../utils/monaco';

export function EditorReadMode() {
  const editorDiffDom = useRef<HTMLDivElement>(null);
  const diffEditor = useRef<monaco.editor.IDiffEditor>();
  const [activeChangeId] = useAtom(activeChangeIdAtom);
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);

  const { data } = useSWR(activeChangeId, (activeChangeId) =>
    getDiffByChangeId({
      activeChange: changes[activeChangeId],
      changes,
      changesOrder,
    })
  );

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
