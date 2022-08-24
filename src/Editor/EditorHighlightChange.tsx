import { useAtomValue } from 'jotai';
import * as monaco from 'monaco-editor';
import React, { useEffect, useMemo, useRef } from 'react';

import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
} from '../atoms/changes';
import { getFileContent } from '../utils/getFileContent';

const modelOld = monaco.editor.createModel('', 'typescript');
const modelNew = monaco.editor.createModel('', 'typescript');

export function EditorHighlightChange({ changeId }: { changeId: string }) {
  const editorDiffDom = useRef<HTMLDivElement>(null);
  //const editor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const diffEditor = useRef<monaco.editor.IDiffEditor>();
  const activeChangeId = useAtomValue(activeChangeIdAtom);
  const changes = useAtomValue(changesAtom);
  const changesOrder = useAtomValue(changesOrderAtom);
  const path = useMemo(
    () => (activeChangeId ? changes[activeChangeId].path : ''),
    [activeChangeId, changes]
  );

  useEffect(() => {
    if (!editorDiffDom.current) return;

    if (!diffEditor.current) {
      diffEditor.current = monaco.editor.createDiffEditor(
        editorDiffDom.current,
        {
          automaticLayout: true,
          theme: 'darkTheme',
          readOnly: true,
          renderSideBySide: false,
          glyphMargin: true,
          ignoreTrimWhitespace: true,
          renderMarginRevertIcon: false,
        }
      );
    }

    const changeIdBefore = changesOrder.findIndex((c) => c === changeId);
    const changeBefore = changes[changesOrder[changeIdBefore - 1]];
    if (!changeBefore) return;

    diffEditor.current.setModel({
      original: modelOld,
      modified: modelNew,
    });

    const content = getFileContent({
      upToChangeId: changeId,
      changes,
      changesOrder,
    });

    const contentBefore = getFileContent({
      upToChangeId: changeBefore.id,
      changes,
      changesOrder,
    });

    modelOld.setValue(contentBefore);
    modelNew.setValue(content);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      // model.dispose()

      diffEditor.current?.dispose();
      diffEditor.current = undefined;
    };
  }, [changes, changesOrder, changeId, editorDiffDom]);

  return (
    <div style={{ height: 'calc(100% - 50px)', width: '100%' }}>
      <div ref={editorDiffDom} className="monaco read-mode"></div>
      <div className="editor-statusbar" style={{ height: 20 }}>
        <div className="path">test {path}</div>
      </div>
    </div>
  );
}
