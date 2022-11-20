import { useAtom } from 'jotai';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import { useCallback } from 'react';

import { activeFileAtom } from '../atoms/files';
import { saveDeltaAtom } from '../atoms/saveChange';
import { modifiedModel } from '../utils/monaco';

export function useHighlight() {
  const [activeFile] = useAtom(activeFileAtom);
  const [, saveDelta] = useAtom(saveDeltaAtom);

  return useCallback(
    (selections: monaco.Selection[]) => {
      if (!activeFile) {
        return;
      }

      saveDelta({
        delta: new Delta(),
        file: activeFile,
        highlight: selections.map((sel) => {
          const start = modifiedModel.getOffsetAt(
            new monaco.Position(sel.startLineNumber, sel.startColumn)
          );
          const end = modifiedModel.getOffsetAt(
            new monaco.Position(sel.endLineNumber, sel.endColumn)
          );

          return {
            length: end - start,
            offset: start,
          };
        }),
      });
    },
    [activeFile, saveDelta]
  );
}
