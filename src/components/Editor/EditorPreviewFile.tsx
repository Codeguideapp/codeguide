import { findLast } from 'lodash';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import { useEffect, useRef } from 'react';

import { composeDeltas, getFileContent } from '../../utils/deltaUtils';
import { isEditing } from '../store/atoms';
import { useChangesStore } from '../store/changes';
import { FileNode, useFilesStore } from '../store/files';
import { useHighlight } from './useHighlight';

export function EditorPreviewFile({
  activeFile,
  upToChangeId,
}: {
  activeFile: FileNode;
  upToChangeId?: string;
}) {
  const saveDelta = useChangesStore((s) => s.saveDelta);
  const modifiedContentListener = useRef<monaco.IDisposable>();
  const selectionListener = useRef<monaco.IDisposable>();
  const editorDom = useRef<HTMLDivElement>(null);
  const standaloneEditor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const saveHighlight = useHighlight();
  const savedChangesLength = useChangesStore(
    (s) => Object.values(s.changes).filter((c) => !c.isDraft).length
  );
  const modifiedModel = useFilesStore((s) => s.activeFileModModel);

  const currentVal = useChangesStore((s) => {
    // refactor: better way to name vars
    const changeIds = Object.keys(s.changes).sort();

    const changesUntil = upToChangeId
      ? changeIds.slice(0, changeIds.indexOf(upToChangeId) + 1)
      : changeIds;

    const previousChangeId = findLast(
      changesUntil,
      (id) => s.changes[id].path === activeFile.path
    );

    return previousChangeId
      ? getFileContent({
          upToChangeId: previousChangeId,
          changes: s.changes,
        })
      : activeFile.oldVal;
  });

  useEffect(() => {
    if (!editorDom.current) return;
    if (!standaloneEditor.current) return;

    standaloneEditor.current.setSelection(new monaco.Selection(0, 0, 0, 0));
  }, [savedChangesLength]);

  useEffect(() => {
    if (!editorDom.current) return;

    if (modifiedModel.getValue() !== currentVal) {
      modifiedModel.setValue(currentVal);
    }
  }, [currentVal]);

  useEffect(() => {
    // initializing editor
    if (!editorDom.current) return;

    modifiedContentListener.current?.dispose();
    standaloneEditor.current?.dispose();

    standaloneEditor.current = monaco.editor.create(editorDom.current, {
      automaticLayout: true,
      theme: 'darkInvertedDiff',
      glyphMargin: true,
      model: modifiedModel,
      readOnly: !isEditing(),
    });

    if (isEditing()) {
      selectionListener.current =
        standaloneEditor.current?.onDidChangeCursorSelection((e) => {
          saveHighlight(
            [e.selection, ...e.secondarySelections].filter(
              (sel) =>
                sel.startLineNumber !== sel.endLineNumber ||
                sel.startColumn !== sel.endColumn
            )
          );
        });

      modifiedContentListener.current = modifiedModel.onDidChangeContent(
        (e) => {
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

          saveDelta({
            delta: composeDeltas(deltas),
            file: activeFile,
            highlight: [],
          });
        }
      );
    }

    return () => {
      modifiedContentListener.current?.dispose();
      standaloneEditor.current?.dispose();
      selectionListener.current?.dispose();
    };
  }, [editorDom, activeFile, saveDelta, saveHighlight]);

  return <div ref={editorDom} className="monaco edit-mode"></div>;
}
