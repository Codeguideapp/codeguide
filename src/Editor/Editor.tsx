import { useAtom } from 'jotai';
import Split from 'react-split';

import { useStepByStepDiffAtom } from '../atoms/options';
import { canEditAtom } from '../atoms/playhead';
import { Comments } from '../Comments/Comments';
import { Guide } from '../Guide/Guide';
import { EditorEditDiff } from './EditorEditDiff';
import { EditorEditStepByStep } from './EditorEditStepByStep';
import { EditorReadMode } from './EditorReadMode';
import { EditorToolbar } from './EditorToolbar';

export function Editor() {
  const [canEdit] = useAtom(canEditAtom);
  const [useStepByStepDiff] = useAtom(useStepByStepDiffAtom);

  return (
    <div className="main-right">
      <Split
        className="split-editor"
        direction="horizontal"
        sizes={[75, 25]}
        minSize={250}
        gutterSize={1}
      >
        <div>
          <div className="editor-top">
            <EditorToolbar />
          </div>
          <div style={{ width: '100%', height: '100%' }}>
            {canEdit ? (
              useStepByStepDiff ? (
                <EditorEditStepByStep />
              ) : (
                <EditorEditDiff />
              )
            ) : (
              <EditorReadMode />
            )}
          </div>
        </div>
        <Guide />
      </Split>
      <Comments />
    </div>
  );
}
