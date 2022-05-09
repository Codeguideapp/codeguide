import { useAtomValue } from 'jotai';
import * as monaco from 'monaco-editor';
import React, { useEffect, useRef } from 'react';

import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
} from '../atoms/changes';
import { getDeltas } from '../utils/getFileContent';
import { blankModel, getMonacoEdits } from '../utils/monaco';

type OpenFile = {
  model: monaco.editor.ITextModel;
  changes: {
    id: string;
    edits: monaco.editor.IValidEditOperation[];
  }[];
};

export function EditorReadMode() {
  const editorDiffDom = useRef<HTMLDivElement>(null);
  const diffEditor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const activeChangeId = useAtomValue(activeChangeIdAtom);
  const changes = useAtomValue(changesAtom);
  const changesOrder = useAtomValue(changesOrderAtom);
  const openFiles = useRef<Record<string, OpenFile>>({});

  useEffect(() => {
    if (!editorDiffDom.current) return;

    if (!diffEditor.current) {
      diffEditor.current = monaco.editor.create(editorDiffDom.current, {
        automaticLayout: true,
        theme: 'defaultDark',
        readOnly: true,
      });
    }

    if (!activeChangeId) {
      if (blankModel.isAttachedToEditor() === false) {
        diffEditor.current?.setModel(blankModel);
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
      diffEditor.current?.setModel(file.model);
    }

    const pathFilteredIds = changesOrder.filter(
      (id) => changes[id].path === change.path
    );
    const changesIdsToApply = pathFilteredIds.slice(
      0,
      pathFilteredIds.indexOf(activeChangeId) + 1
    );

    let sameUntil = -1;
    for (let i = 0; i < file.changes.length; i++) {
      if (file.changes[i].id !== changesIdsToApply[i]) {
        break;
      } else {
        sameUntil = i;
      }
    }

    if (
      changesIdsToApply.length === file.changes.length &&
      changesIdsToApply.length === sameUntil + 1
    ) {
      return;
    }

    const deltas = getDeltas({
      changeId: activeChangeId,
      changes,
      changesOrder,
    });

    const toUndo = file.changes.slice(sameUntil + 1);
    const toApply = deltas.slice(sameUntil + 1);

    for (let i = 0; i < toUndo.length; i++) {
      const last = file.changes.pop();
      if (last) {
        file.model.applyEdits(last.edits);
      }
    }

    for (const { delta, id } of toApply) {
      file.changes.push({
        edits: file.model.applyEdits(getMonacoEdits(delta, file.model), true),
        id,
      });
    }
  }, [editorDiffDom, changes, changesOrder, activeChangeId]);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      for (const file of Object.values(openFiles.current)) {
        file.model.dispose();
      }
      diffEditor.current?.dispose();
    };
  }, [editorDiffDom]);

  return <div ref={editorDiffDom} className="monaco read-mode"></div>;
}
