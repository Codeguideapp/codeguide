import { useAtomValue } from 'jotai';
import * as monaco from 'monaco-editor';
import React, { useEffect, useMemo, useRef } from 'react';

import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
} from '../atoms/changes';
import { applyDelta, blankModel, getRange } from '../utils/monaco';

type OpenFile = {
  model: monaco.editor.ITextModel;
  changes: string[];
  decorations: string[];
};

export function EditorReadMode() {
  const editorDiffDom = useRef<HTMLDivElement>(null);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const activeChangeId = useAtomValue(activeChangeIdAtom);
  const changes = useAtomValue(changesAtom);
  const changesOrder = useAtomValue(changesOrderAtom);
  const openFiles = useRef<Record<string, OpenFile>>({});
  const path = useMemo(
    () => (activeChangeId ? changes[activeChangeId].path : ''),
    [activeChangeId, changes]
  );

  useEffect(() => {
    if (!editorDiffDom.current) return;

    if (!editor.current) {
      editor.current = monaco.editor.create(editorDiffDom.current, {
        automaticLayout: true,
        theme: 'darkTheme',
        readOnly: true,
        smoothScrolling: true,
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
        decorations: [],
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

    if (file.changes.length > changesUpToActive.length) {
      const numChangesToUno = file.changes.length - changesUpToActive.length;

      for (let i = 0; i < numChangesToUno; i++) {
        const last = file.changes.pop();
        const delta = last ? changes[last].deltaInverted : undefined;
        if (delta) {
          const cursorOffset = applyDelta(delta, file.model);
          editor.current.setPosition(file.model.getPositionAt(cursorOffset));
        }
      }
    }

    if (changesUpToActive.length > file.changes.length) {
      const numChangesToApply = changesUpToActive.length - file.changes.length;

      for (const { delta, id } of changesUpToActive.slice(-numChangesToApply)) {
        if (delta) {
          const cursorOffset = applyDelta(delta, file.model);
          editor.current.setPosition(file.model.getPositionAt(cursorOffset));
        }
        file.changes.push(id);
      }
    }

    file.decorations = editor.current.deltaDecorations(
      file.decorations,
      changes[activeChangeId].highlight.map((highlight) => ({
        range: getRange(file.model, highlight.offset, highlight.length),
        options: highlight.options,
      }))
    );

    changes[activeChangeId].highlight.forEach((highlight, i) => {
      const range = getRange(file.model, highlight.offset, highlight.length);

      editor.current?.revealRangeInCenterIfOutsideViewport(
        range,
        monaco.editor.ScrollType.Smooth
      );
    });
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

  return (
    <div style={{ height: 'calc(100% - 20px)', width: '100%' }}>
      <div ref={editorDiffDom} className="monaco read-mode"></div>
      <div className="editor-statusbar" style={{ height: 20 }}>
        <div className="path">{path}</div>
      </div>
    </div>
  );
}
