import { useAtom } from 'jotai';
import Split from 'react-split';

import { highlightChangeIdAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { useStepByStepDiffAtom } from '../atoms/options';
import { Comments } from '../Comments/Comments';
import { Guide } from '../Guide/Guide';
import { EditorEditDiff } from './EditorEditDiff';
import { EditorEditStepByStep } from './EditorEditStepByStep';
import { EditorHighlightChange } from './EditorHighlightChange';
import { EditorToolbar } from './EditorToolbar';
import { Welcome } from './Welcome';

export function Editor() {
  const [highlightChangeId] = useAtom(highlightChangeIdAtom);
  const [useStepByStepDiff] = useAtom(useStepByStepDiffAtom);
  const [activeFile] = useAtom(activeFileAtom);

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
              <div className="filename">
                {activeFile ? activeFile?.path.split('/').pop() : 'Welcome'}
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
          <Comments />
        </Split>

        <Guide />
      </Split>
    </div>
  );
}
