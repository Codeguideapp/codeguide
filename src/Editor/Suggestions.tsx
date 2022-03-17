import * as monaco from 'monaco-editor';
import React from 'react';

import { useStore } from '../store/store';

export const Suggestions = ({
  editor,
}: {
  editor: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
}) => {
  const suggestions = useStore((state) => state.suggestions);

  return (
    <ul>
      {suggestions.map((suggestion) =>
        suggestion.type === 'insert' ? (
          <li
            key={suggestion.index}
            onClick={() => {
              const pos = editor.current
                ?.getModel()
                ?.getPositionAt(suggestion.index);

              if (!pos) return;

              editor.current?.getModel()?.applyEdits([
                {
                  range: new monaco.Range(
                    pos.lineNumber,
                    pos.column,
                    pos.lineNumber,
                    pos.column
                  ),
                  text: suggestion.value,
                },
              ]);
            }}
          >
            {suggestion.type} {suggestion.value}
          </li>
        ) : suggestion.type === 'replace' ? (
          <li key={suggestion.index}>
            {suggestion.type} {suggestion.value}
          </li>
        ) : (
          <li key={suggestion.index}>{suggestion.type}</li>
        )
      )}
    </ul>
  );
};
