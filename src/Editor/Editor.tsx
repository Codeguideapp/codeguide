import classNames from 'classnames';
import { useAtom } from 'jotai';
import Split from 'react-split';

import {
  highlightChangeIdAtom,
  highlightChangeIndexAtom,
} from '../atoms/changes';
import { activeFileAtom, unsavedFilePathsAtom } from '../atoms/files';
import { useStepByStepDiffAtom } from '../atoms/options';
import { Guide } from '../Guide/Guide';
import { Notes } from '../Notes/Notes';
import { EditorEditDiff } from './EditorEditDiff';
import { EditorEditStepByStep } from './EditorEditStepByStep';
import { EditorHighlightChange } from './EditorHighlightChange';
import { EditorToolbar } from './EditorToolbar';
import { Welcome } from './Welcome';

export function Editor() {
  const [highlightChangeId] = useAtom(highlightChangeIdAtom);
  const [useStepByStepDiff] = useAtom(useStepByStepDiffAtom);
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
        <Split direction="vertical" sizes={[75, 25]} gutterSize={1}>
          <div>
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
            <div style={{ width: '100%', height: 'calc(100% - 30px)' }}>
              {!activeFile ? (
                <Welcome />
              ) : highlightChangeId ? (
                <EditorHighlightChange changeId={highlightChangeId} />
              ) : useStepByStepDiff ? (
                <EditorEditStepByStep />
              ) : (
                <EditorEditDiff />
              )}
            </div>
          </div>
          <Notes />
        </Split>

        <Guide />
      </Split>
    </div>
  );
}
