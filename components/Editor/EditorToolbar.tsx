/* eslint-disable @next/next/no-img-element */
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCodeCompare,
  faHighlighter,
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'antd';
import { useAtom } from 'jotai';

import { activeFileAtom } from '../atoms/files';
import { showWhitespaceAtom } from '../atoms/layout';

library.add(faHighlighter, faCodeCompare);

export function EditorToolbar() {
  const [activeFile] = useAtom(activeFileAtom);
  const [showWhitespace, setShowWhitespace] = useAtom(showWhitespaceAtom);

  return (
    <div className="editor-toolbar">
      {activeFile?.isFileDiff && (
        <Tooltip title="Show Leading/Trailing Whitespace Differences">
          <img
            width="16"
            src="/icons/whitespace.svg"
            alt=""
            onClick={() => setShowWhitespace(!showWhitespace)}
          />
        </Tooltip>
      )}
    </div>
  );
}
