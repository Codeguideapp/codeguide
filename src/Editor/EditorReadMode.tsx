import { useAtomValue } from 'jotai';
import * as monaco from 'monaco-editor';
import React, { useEffect, useRef } from 'react';

import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
} from '../atoms/changes';
import { applyDelta, blankModel } from '../utils/monaco';

type OpenFile = {
  model: monaco.editor.ITextModel;
  changes: string[];
};

export function EditorReadMode() {
  const editorDiffDom = useRef<HTMLDivElement>(null);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const activeChangeId = useAtomValue(activeChangeIdAtom);
  const changes = useAtomValue(changesAtom);
  const changesOrder = useAtomValue(changesOrderAtom);
  const openFiles = useRef<Record<string, OpenFile>>({});

  useEffect(() => {
    if (!editorDiffDom.current) return;

    if (!editor.current) {
      editor.current = monaco.editor.create(editorDiffDom.current, {
        automaticLayout: true,
        theme: 'defaultDark',
        readOnly: true,
      });
    }

    if (!activeChangeId) {
      if (blankModel.isAttachedToEditor() === false) {
        editor.current?.setModel(blankModel);
      }
      return;
    }

    const change = changes[activeChangeId];
    let file = openFiles.current[change.path];

    if (!file) {
      openFiles.current[change.path] = {
        model: monaco.editor.createModel('', 'typescript'),
        changes: [],
      };
      file = openFiles.current[change.path];
    }

    if (file.model.isAttachedToEditor() === false) {
      editor.current?.setModel(file.model);
    }

    const fileChangesIds = changesOrder.filter(
      (id) => changes[id].path === change.path
    );
    const changesUpToActive = fileChangesIds
      .slice(0, fileChangesIds.indexOf(activeChangeId) + 1)
      .map((id) => ({ id, delta: changes[id].delta }));

    if (changesUpToActive.length === file.changes.length) {
      return;
    }

    if (file.changes.length > changesUpToActive.length) {
      const numChangesToUno = file.changes.length - changesUpToActive.length;

      for (let i = 0; i < numChangesToUno; i++) {
        const last = file.changes.pop();
        if (last) {
          const delta = changes[last].deltaInverted;
          applyDelta(delta, file.model);
        }
      }
    }

    if (changesUpToActive.length > file.changes.length) {
      const numChangesToApply = changesUpToActive.length - file.changes.length;

      for (const { delta, id } of changesUpToActive.slice(-numChangesToApply)) {
        applyDelta(delta, file.model);
        file.changes.push(id);
      }
    }
  }, [editorDiffDom, changes, changesOrder, activeChangeId]);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      for (const file of Object.values(openFiles.current)) {
        file.model.dispose();
      }
      editor.current?.dispose();
    };
  }, [editorDiffDom]);

  return <div ref={editorDiffDom} className="monaco read-mode"></div>;
}
