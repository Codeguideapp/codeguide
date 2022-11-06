import classNames from 'classnames';
import { useAtom } from 'jotai';
import Split from 'react-split';

import {
  highlightChangeIdAtom,
  highlightChangeIndexAtom,
} from '../atoms/changes';
import {
  activeFileAtom,
  isFileDiff,
  unsavedFilePathsAtom,
} from '../atoms/files';
import { Guide } from '../Guide/Guide';
import { StepControls } from '../StepControls/StepControls';
import { EditorEditDiff } from './EditorEditDiff';
import { EditorHighlightChange } from './EditorHighlightChange';
import { EditorToolbar } from './EditorToolbar';
import { Welcome } from './Welcome';

export function Editor() {
  const [highlightChangeId] = useAtom(highlightChangeIdAtom);
  const [activeFile] = useAtom(activeFileAtom);
  const [unsavedFilePaths] = useAtom(unsavedFilePathsAtom);
  const [highlightChangeIndex] = useAtom(highlightChangeIndexAtom);

  return (
    <div className="main-right">
      <Split
        className="split-editor"
        direction="horizontal"
        sizes={[75, 25]}
        minSize={250}
        gutterSize={1}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{ display: 'flex', flexGrow: 1, flexDirection: 'column' }}
          >
            <div className="editor-top">
              <div
                className={classNames({
                  filename: true,
                  'in-past': Boolean(highlightChangeId),
                })}
              >
                {activeFile ? activeFile?.path.split('/').pop() : 'Welcome'}
                {highlightChangeId ? `  (step ${highlightChangeIndex})` : ''}
                <div
                  className={classNames({
                    unsaved: true,
                    hidden: activeFile?.path
                      ? !unsavedFilePaths.includes(activeFile.path)
                      : true,
                  })}
                ></div>
              </div>
              <EditorToolbar />
            </div>
            <div style={{ width: '100%', flexGrow: 1 }}>
              {!activeFile ? (
                <Welcome />
              ) : highlightChangeId ? (
                <EditorHighlightChange changeId={highlightChangeId} />
              ) : isFileDiff(activeFile) ? (
                <EditorEditDiff activeFile={activeFile} />
              ) : (
                <div>hello</div>
              )}
            </div>
          </div>
          <StepControls />
        </div>

        <Guide />
      </Split>
    </div>
  );
}
