import { useAtom } from 'jotai';
import { findLast } from 'lodash';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useEffect, useRef } from 'react';

import { changesAtom, changesOrderAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { saveDeltaAtom } from '../atoms/saveDeltaAtom';
import { composeDeltas } from '../utils/deltaUtils';
import { getFileContent } from '../utils/getFileContent';
import {
  diffGutterMouseHandler,
  modifiedModel,
  originalModel,
} from '../utils/monaco';

export function EditorEditMode() {
  const modifiedContentListener = useRef<monaco.IDisposable>();
  const diffListener = useRef<monaco.IDisposable>();
  const diffMouseDownListener = useRef<monaco.IDisposable>();
  const editorDiffDom = useRef<HTMLDivElement>(null);
  const diffEditor = useRef<monaco.editor.IDiffEditor>();
  const decorations = useRef<string[]>([]);
  const [activeFile] = useAtom(activeFileAtom);
  const [, saveDelta] = useAtom(saveDeltaAtom);
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);

  useEffect(() => {
    // initializing editor
    if (!editorDiffDom.current) return;

    diffEditor.current?.dispose();
    diffListener.current?.dispose();
    diffMouseDownListener.current?.dispose();

    diffEditor.current = monaco.editor.createDiffEditor(editorDiffDom.current, {
      automaticLayout: true,
      theme: 'defaultDark',
      originalEditable: true,
      readOnly: true,
      glyphMargin: true,
      ignoreTrimWhitespace: false,
    });

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
      modifiedModel.setValue('');
      originalModel.setValue('');
    };
  }, [editorDiffDom]);

  useEffect(() => {
    modifiedContentListener.current?.dispose();

    if (!activeFile) {
      originalModel.setValue('');
      modifiedModel.setValue('');
      return;
    }

    const previousChangeId = findLast(
      changesOrder,
      (id) => changes[id].path === activeFile.path
    );

    const before = previousChangeId
      ? getFileContent({
          changeId: previousChangeId,
          changes,
          changesOrder,
        })
      : activeFile.oldVal;

    const after = activeFile.newVal;

    if (originalModel.getValue() !== after) {
      originalModel.setValue(after);
    }
    if (modifiedModel.getValue() !== before) {
      modifiedModel.setValue(before);
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

      saveDelta(composeDeltas(deltas));
    });
  }, [activeFile, changesOrder, saveDelta]); // not watching changes as dep, because it is covered by changesOrder

  return <div ref={editorDiffDom} className="monaco edit-mode"></div>;
}
