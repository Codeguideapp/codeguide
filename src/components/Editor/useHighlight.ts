import { isEqual } from 'lodash';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import { useCallback } from 'react';
import { useRef } from 'react';

import { modifiedModel } from '../../utils/monaco';
import { useChangesStore } from '../store/changes';
import { useFilesStore } from '../store/files';

export function useHighlight() {
  const activeFile = useFilesStore((s) => s.activeFile);
  const saveDelta = useChangesStore((s) => s.saveDelta);
  const lastHighlight = useRef<
    {
      length: number;
      offset: number;
    }[]
  >([]);

  return useCallback(
    (selections: monaco.Selection[]) => {
      if (!activeFile) {
        return;
      }

      const highlight = selections.map((sel) => {
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
      });

      if (isEqual(highlight, lastHighlight.current)) return;

      lastHighlight.current = highlight;
      saveDelta({
        delta: new Delta(),
        file: activeFile,
        highlight,
      });
    },
    [activeFile, lastHighlight, saveDelta]
  );
}
