import React from 'react';

import { Command } from '../edits';
import { useStore } from '../store/store';

export const Suggestions = ({
  showSuggestion,
  applySuggestion,
  hideSuggestion,
}: {
  showSuggestion: (suggestion: Command) => void;
  hideSuggestion: () => void;
  applySuggestion: (suggestion: Command) => void;
}) => {
  const suggestions = useStore((state) => state.suggestions);

  return (
    <ul>
      {suggestions.map((suggestion) => (
        <li
          key={suggestion.index}
          onMouseEnter={() => {
            showSuggestion(suggestion);
          }}
          onMouseLeave={() => {
            hideSuggestion();
          }}
          onClick={() => {
            applySuggestion(suggestion);
          }}
        >
          {suggestion.type} {suggestion.value}
        </li>
      ))}
    </ul>
  );
};
