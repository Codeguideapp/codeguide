import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCodeCompare,
  faHighlighter,
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'antd';
import { useAtom } from 'jotai';

import { showWhitespaceAtom } from '../atoms/layout';
//import { ReactComponent as WhitespaceIcon } from './whitespace.svg';

library.add(faHighlighter, faCodeCompare);

export function EditorToolbar() {
  const [showWhitespace, setShowWhitespace] = useAtom(showWhitespaceAtom);

  return (
    <div className="editor-toolbar">
      <Tooltip title="Show Leading/Trailing Whitespace Differences">
        w
        {/* <WhitespaceIcon
          width={16}
          style={{ opacity: showWhitespace ? 1 : 0.4 }}
          onClick={() => setShowWhitespace(!showWhitespace)}
        /> */}
      </Tooltip>
    </div>
  );
}
