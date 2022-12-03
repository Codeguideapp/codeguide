import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import { useCallback } from 'react';

import { useChangesStore } from '../store/changes';
import { useFilesStore } from '../store/files';
import { modifiedModel } from '../utils/monaco';

export function useHighlight() {
  const activeFile = useFilesStore((s) => s.activeFile);
  const saveDelta = useChangesStore((s) => s.saveDelta);

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
