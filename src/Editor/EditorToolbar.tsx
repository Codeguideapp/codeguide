import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCodeCompare,
  faHighlighter,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'antd';
import { useAtom } from 'jotai';

import { showWhitespaceAtom, useStepByStepDiffAtom } from '../atoms/options';
import { ReactComponent as WhitespaceIcon } from './whitespace.svg';

library.add(faHighlighter, faCodeCompare);

export function EditorToolbar() {
  const [useStepByStepDiff, setUseStepByStepDiff] = useAtom(
    useStepByStepDiffAtom
  );
  const [showWhitespace, setShowWhitespace] = useAtom(showWhitespaceAtom);

  return (
    <div className="editor-toolbar">
      <Tooltip
        title={`Step-By-Step Diff (BETA): ${useStepByStepDiff ? 'ON' : 'OFF'}`}
      >
        <FontAwesomeIcon
          icon="code-compare"
          style={{ color: useStepByStepDiff ? 'rgb(178 97 201)' : '#666' }}
          onClick={() => setUseStepByStepDiff(!useStepByStepDiff)}
        />
      </Tooltip>

      {!useStepByStepDiff && (
        <Tooltip title="Show Leading/Trailing Whitespace Differences">
          <WhitespaceIcon
            width={16}
            style={{ opacity: showWhitespace ? 1 : 0.4 }}
            onClick={() => setShowWhitespace(!showWhitespace)}
          />
        </Tooltip>
      )}
    </div>
  );
}
