import { useAtomValue } from 'jotai';
import * as monaco from 'monaco-editor';
import React, { useEffect, useRef } from 'react';

import { changesAtom, changesOrderAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { monacoThemeRef } from '../atoms/layout';
import { showWhitespaceAtom } from '../atoms/options';
import { getFileContent } from '../utils/deltaUtils';

const modelPrev = monaco.editor.createModel('', 'typescript');
const modelCurrent = monaco.editor.createModel('', 'typescript');

export function EditorHighlightChange({ changeId }: { changeId: string }) {
  const monacoDom = useRef<HTMLDivElement>(null);
  const standaloneEditor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const diffEditor = useRef<monaco.editor.IDiffEditor>();
  const changes = useAtomValue(changesAtom);
  const changesOrder = useAtomValue(changesOrderAtom);
  const activeFile = useAtomValue(activeFileAtom);
  const showWhitespace = useAtomValue(showWhitespaceAtom);

  useEffect(() => {
    if (!monacoDom.current) return;
    if (!activeFile) return;

    const contentCurrent = getFileContent({
      upToChangeId: changeId,
      changes,
      changesOrder,
    });

    const currentChange = changes[changeId];
    const currentChangeIndex = changesOrder.findIndex((c) => c === changeId);
    const prevChange = changes[changesOrder[currentChangeIndex - 1]];

    monacoThemeRef.current = 'darkTheme';

    if (activeFile.path !== currentChange.path) {
      const changesUpToChangeId = changesOrder
        .slice(0, currentChangeIndex)
        .map((id) => changes[id]);

      const changeForTheFile = changesUpToChangeId
        .reverse()
        .find((c) => c.path === activeFile.path);

      if (changeForTheFile) {
        modelCurrent.setValue(
          getFileContent({
            upToChangeId: changeForTheFile.id,
            changes,
            changesOrder,
          })
        );
      } else {
        modelCurrent.setValue('old');
      }

      standaloneEditor.current = monaco.editor.create(monacoDom.current, {
        automaticLayout: true,
        theme: monacoThemeRef.current,
        readOnly: true,
      });
      standaloneEditor.current.setModel(modelCurrent);
    } else if (!prevChange || prevChange.path !== currentChange.path) {
      modelCurrent.setValue(contentCurrent);

      standaloneEditor.current = monaco.editor.create(monacoDom.current, {
        automaticLayout: true,
        theme: monacoThemeRef.current,
        readOnly: true,
      });
      standaloneEditor.current.setModel(modelCurrent);
    } else {
      const contentPrev = getFileContent({
        upToChangeId: prevChange.id,
        changes,
        changesOrder,
      });

      modelCurrent.setValue(contentCurrent);
      modelPrev.setValue(contentPrev);

      if (!diffEditor.current) {
        diffEditor.current = monaco.editor.createDiffEditor(monacoDom.current, {
          automaticLayout: true,
          theme: monacoThemeRef.current,
          readOnly: true,
          renderSideBySide: false,
          glyphMargin: true,
          ignoreTrimWhitespace: !showWhitespace,
          renderMarginRevertIcon: false,
        });
      }

      diffEditor.current.setModel({
        original: modelPrev,
        modified: modelCurrent,
      });
    }

    return () => {
      standaloneEditor.current?.dispose();
      standaloneEditor.current = undefined;

      diffEditor.current?.dispose();
      diffEditor.current = undefined;
    };
  }, [changes, changesOrder, activeFile, changeId, monacoDom, showWhitespace]);

  return <div ref={monacoDom} className="monaco read-mode"></div>;
}
