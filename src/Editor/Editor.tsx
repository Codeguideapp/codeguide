// save draft pa se stvori novi change
// use immer https://github.com/pmndrs/zustand#sick-of-reducers-and-changing-nested-state-use-immer

import { last } from 'lodash';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useCallback, useEffect, useRef } from 'react';
import * as Y from 'yjs';

import { createYText, sync } from '../edits';
import { deltaToString, useStore } from '../store/store';

export function Editor() {
  const monacoListener = useRef<monaco.IDisposable>({ dispose: () => {} });
  const editorDiv = useRef<HTMLDivElement>(null);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const activeFileInitial = useStore((state) => state.activeFileInitial);
  const activeFileChanged = useStore((state) => state.activeFileChanged);
  const appliedChangesIds = useStore((state) => state.appliedChangesIds);
  const changes = useStore((state) => state.changes);
  const activeChangeId = useStore((state) => state.activeChangeId);
  const pushDraftDelta = useStore(
    useCallback((state) => state.pushDraftDelta, [])
  );

  useEffect(() => {
    if (editorDiv.current) {
      const readOnly = activeChangeId !== 'draft';

      editor.current = window.monaco.editor.create(editorDiv.current, {
        value: activeFileInitial,
        language: 'javascript',
        readOnly: readOnly,
        theme: readOnly ? 'readonly' : 'vs-dark',
      });
    }
  }, [editorDiv]);

  useEffect(() => {
    if (!editor.current) return;

    const readOnly = activeChangeId !== 'draft';

    editor.current.updateOptions({
      readOnly: readOnly,
      theme: readOnly ? 'readonly' : 'vs-dark',
    });

    const monacoModel = editor.current.getModel();
    if (!monacoModel) return;
  }, [activeChangeId, pushDraftDelta]);

  useEffect(() => {
    monacoListener.current.dispose();
    if (!editor.current) return;
    const monacoModel = editor.current.getModel();
    if (!monacoModel) return;

    if (activeChangeId === 'draft') {
      monacoListener.current = monacoModel.onDidChangeContent((e) => {
        e.changes.forEach((change) => {
          const delta = new Delta();
          if (change.rangeOffset > 0) {
            delta.retain(change.rangeOffset);
          }
          if (change.rangeLength) {
            delta.delete(change.rangeLength);
          }
          if (change.text) {
            delta.insert(change.text);
          }

          pushDraftDelta(delta);
        });

        // if (
        //   draftValue !== undefined &&
        //   editor.current?.getValue() === activeFileChanged
        // ) {
        //   setDraftValue(undefined);
        // } else if (draftValue !== editor.current?.getValue()) {
        //   setDraftValue(editor.current?.getValue());
        // }
      });

      // if (
      //   draftValue !== undefined &&
      //   draftValue !== editor.current.getValue()
      // ) {
      //   editor.current.setValue(draftValue);
      // } else if (
      //   draftValue === undefined &&
      //   activeFileChanged !== editor.current.getValue()
      // ) {
      //   editor.current.setValue(activeFileChanged);
      // }
      // let ydoc = new Y.Doc();
      // let draftYText = ydoc.getText(editor.current.getValue());
      // // @ts-ignore
      // if (window.ytext) {
      //   // @ts-ignore
      //   ydoc = window.ytext.doc;
      //   // @ts-ignore
      //   draftYText = window.ytext;
      // }
      // // @ts-ignore
      // window.ytext = draftYText;
    } else {
      // take all changes using appliedChangesIds
      // evertything from start to playhead

      const yTextPerChange: Record<string, Y.Text> = {};
      const targetYText = createYText('');

      appliedChangesIds.forEach((id) => {
        const { deltas, deps } = changes[id];
        const lastDep = last(deps);

        const changeYtext = createYText(lastDep ? yTextPerChange[lastDep] : '');
        changeYtext.applyDelta(deltas.ops);
        yTextPerChange[id] = changeYtext;

        sync(changeYtext, targetYText);
      });

      editor.current.setValue(targetYText.toString());
    }
  }, [
    appliedChangesIds,
    changes,
    activeChangeId,
    activeFileInitial,
    activeFileChanged,
    pushDraftDelta,
  ]);

  return (
    <div
      ref={editorDiv}
      id="editor"
      style={{
        width: 800,
        height: 400,
      }}
    ></div>
  );
}
