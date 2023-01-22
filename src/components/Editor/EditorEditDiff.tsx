import { useAtom } from 'jotai';
import { findLast } from 'lodash';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import { useEffect, useRef } from 'react';

import { composeDeltas, getFileContent } from '../../utils/deltaUtils';
import { modifiedModel, originalModel, previewModel } from '../../utils/monaco';
import { usePrevious } from '../hooks/usePrevious';
import { showWhitespaceAtom } from '../store/atoms';
import { useChangesStore } from '../store/changes';
import { FileNode } from '../store/files';
import { useHighlight } from './useHighlight';

export function EditorEditDiff({ activeFile }: { activeFile: FileNode }) {
  const saveDelta = useChangesStore((s) => s.saveDelta);
  const modifiedContentListener = useRef<monaco.IDisposable>();
  const selectionListener = useRef<monaco.IDisposable>();
  const editorDiffDom = useRef<HTMLDivElement>(null);
  const diffEditor = useRef<monaco.editor.IStandaloneDiffEditor>();
  const [showWhitespace] = useAtom(showWhitespaceAtom);
  const saveHighlight = useHighlight();
  const prevFile = usePrevious(activeFile);
  const savedChangesLength = useChangesStore(
    (s) => Object.values(s.changes).filter((c) => !c.isDraft).length
  );
  const currentVal = useChangesStore((s) => {
    const previousChangeId = findLast(
      Object.keys(s.changes).sort(),
      (id) => s.changes[id].path === activeFile.path
    );

    return previousChangeId
      ? getFileContent({
          upToChangeId: previousChangeId,
          changes: s.changes,
        })
      : activeFile.oldVal;
  });
  const diffNavigatorRef = useRef<monaco.IDisposable>();

  useEffect(() => {
    // initializing editor
    if (!editorDiffDom.current) return;

    diffEditor.current = monaco.editor.createDiffEditor(editorDiffDom.current, {
      automaticLayout: true,
      theme: 'darkInvertedDiff',
      glyphMargin: true,
      ignoreTrimWhitespace: !showWhitespace,
    });

    diffEditor.current.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    diffEditor.current
      .getOriginalEditor()
      .changeViewZones(function (changeAccessor) {
        const domNode = document.createElement('div');
        domNode.className = 'diff-header';
        domNode.innerHTML = `
        <h2>End result</h2>
        <p>The final version of the file</p>
      `;
        changeAccessor.addZone({
          afterLineNumber: 0,
          heightInLines: 4,
          domNode: domNode,
        });
      });

    diffEditor.current
      .getModifiedEditor()
      .changeViewZones(function (changeAccessor) {
        const domNode = document.createElement('div');
        domNode.className = 'diff-header';
        domNode.innerHTML = `
          <h2>Current version</h2>
          <p>Working copy of a file used for steps</p>
        `;
        changeAccessor.addZone({
          afterLineNumber: 0,
          heightInLines: 4,
          domNode: domNode,
        });
      });

    return () => {
      diffEditor.current?.dispose();
      selectionListener.current?.dispose();
      modifiedContentListener.current?.dispose();
      diffNavigatorRef.current?.dispose();
      modifiedModel.setValue('');
      originalModel.setValue('');
    };
  }, [editorDiffDom]); // showWhitespace is used only for initialization so it is not included in dep

  useEffect(() => {
    // initializing editor
    if (!diffEditor.current) return;

    diffEditor.current.updateOptions({
      ignoreTrimWhitespace: !showWhitespace,
    });
  }, [showWhitespace]);

  useEffect(() => {
    if (!diffEditor.current) return;

    diffEditor.current
      .getModifiedEditor()
      .setSelection(new monaco.Selection(0, 0, 0, 0));
  }, [savedChangesLength]);

  useEffect(() => {
    modifiedContentListener.current?.dispose();
    selectionListener.current?.dispose();

    const goal = activeFile.newVal;

    if (modifiedModel.getValue() !== currentVal) {
      modifiedModel.setValue(currentVal);
    }
    if (previewModel.getValue() !== currentVal) {
      previewModel.setValue(currentVal);
    }
    if (originalModel.getValue() !== goal) {
      originalModel.setValue(goal);
    }

    if (prevFile?.path !== activeFile.path) {
      diffNavigatorRef.current = monaco.editor.createDiffNavigator(
        diffEditor.current!,
        {
          alwaysRevealFirst: true,
        }
      );
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

      saveDelta({
        delta: composeDeltas(deltas),
        file: activeFile,
        highlight: [],
      });
    });

    selectionListener.current = diffEditor.current
      ?.getModifiedEditor()
      .onDidChangeCursorSelection((e) => {
        saveHighlight(
          [e.selection, ...e.secondarySelections].filter(
            (sel) =>
              sel.startLineNumber !== sel.endLineNumber ||
              sel.startColumn !== sel.endColumn
          )
        );
      });
  }, [currentVal, activeFile, prevFile?.path, saveDelta, saveHighlight]);

  return <div ref={editorDiffDom} className="monaco edit-mode"></div>;
}
