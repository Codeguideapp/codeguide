import { useAtomValue } from 'jotai';
import * as monaco from 'monaco-editor';
import React, { useEffect, useRef } from 'react';

import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
} from '../atoms/changes';
import { getFileContent } from '../utils/getFileContent';
import { modifiedModel, originalModel } from '../utils/monaco';

export function EditorReadModeDiff() {
  const editorDiffDom = useRef<HTMLDivElement>(null);
  const diffEditor = useRef<monaco.editor.IDiffEditor>();
  const activeChangeId = useAtomValue(activeChangeIdAtom);
  const changes = useAtomValue(changesAtom);
  const changesOrder = useAtomValue(changesOrderAtom);

  useEffect(() => {
    if (!activeChangeId) {
      originalModel.setValue('');
      modifiedModel.setValue('');
      return;
    }

    const activeChange = changes[activeChangeId];
    const previousChange = changesOrder
      .slice(0, changesOrder.indexOf(activeChangeId))
      .reverse()
      .map((id) => changes[id])
      .find((change) => change.path === activeChange.path);

    const before = previousChange
      ? getFileContent({
          upToChangeId: previousChange.id,
          changes,
          changesOrder,
        })
      : '';

    const after = getFileContent({
      upToChangeId: activeChangeId,
      changes,
      changesOrder,
    });

    originalModel.setValue(after);
    modifiedModel.setValue(before);
  }, [changes, changesOrder, activeChangeId]);

  useEffect(() => {
    // initializing editor
    if (!editorDiffDom.current) return;

    diffEditor.current?.dispose();

    diffEditor.current = monaco.editor.createDiffEditor(editorDiffDom.current, {
      automaticLayout: true,
      theme: 'defaultDark',
      originalEditable: false,
      readOnly: true,
      ignoreTrimWhitespace: false,
    });

    diffEditor.current.setModel({
      original: modifiedModel,
      modified: originalModel,
    });

    return () => {
      modifiedModel.setValue('');
      originalModel.setValue('');
      diffEditor.current?.dispose();
    };
  }, [editorDiffDom]);

  return <div ref={editorDiffDom} className="monaco read-mode"></div>;
}
