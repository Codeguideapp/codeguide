import { library } from '@fortawesome/fontawesome-svg-core';
import { faHighlighter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'antd';
import { useAtom } from 'jotai';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import { useCallback } from 'react';

import { changesAtom, changesOrderAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { saveDeltaAtom } from '../atoms/saveDeltaAtom';

library.add(faHighlighter);

export function EditorToolbar({
  selections,
  monacoModel,
}: {
  selections: monaco.Selection[];
  monacoModel: monaco.editor.ITextModel;
}) {
  const [activeFile] = useAtom(activeFileAtom);
  const [, saveDelta] = useAtom(saveDeltaAtom);
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);

  const highligterClickHandler = useCallback(() => {
    if (!activeFile) return;

    saveDelta({
      delta: new Delta(),
      file: activeFile,
      highlight: selections.map((sel) => {
        if (
          activeFile.status !== 'added' &&
          !changesOrder.find((id) => changes[id].path === activeFile.path)
        ) {
          // this is first time change is saved for a file
          saveDelta({
            file: activeFile,
            isFileDepChange: true,
            delta: new Delta().insert(activeFile.oldVal),
            eolChar: monacoModel.getEOL(),
          });
        }

        const start = monacoModel.getOffsetAt(
          new monaco.Position(sel.startLineNumber, sel.startColumn)
        );
        const end = monacoModel.getOffsetAt(
          new monaco.Position(sel.endLineNumber, sel.endColumn)
        );

        return {
          length: end - start,
          offset: start,
          type: 'selection',
          options: {
            className: 'select-highlight',
          },
        };
      }),
    });
  }, [activeFile, changes, changesOrder, saveDelta, selections, monacoModel]);

  return selections.length ? (
    <Tooltip title="Save selection">
      <FontAwesomeIcon
        icon="highlighter"
        style={{ cursor: 'pointer' }}
        onClick={highligterClickHandler}
      />
    </Tooltip>
  ) : (
    <Tooltip title="Select code in order to enable highlighter">
      <FontAwesomeIcon icon="highlighter" style={{ opacity: 0.2 }} />
    </Tooltip>
  );
}
