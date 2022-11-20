import classNames from 'classnames';
import { useAtom } from 'jotai';
import { useState } from 'react';
import Split from 'react-split';

import {
  highlightChangeIdAtom,
  highlightChangeIndexAtom,
} from '../atoms/changes';
import { activeFileAtom, unsavedFilePathsAtom } from '../atoms/files';
import { isEditAtom } from '../atoms/guide';
import { stepControlHeightAtom } from '../atoms/layout';
import { Guide } from '../Guide/Guide';
import { StepControls } from '../StepControls/StepControls';
import { EditorEditDiff } from './EditorEditDiff';
import { EditorHighlightChange } from './EditorHighlightChange';
import { EditorPreviewFile } from './EditorPreviewFile';
import { EditorToolbar } from './EditorToolbar';
import { Welcome } from './Welcome';

export function Editor() {
  const [highlightChangeId] = useAtom(highlightChangeIdAtom);
  const [activeFile] = useAtom(activeFileAtom);
  const [unsavedFilePaths] = useAtom(unsavedFilePathsAtom);
  const [highlightChangeIndex] = useAtom(highlightChangeIndexAtom);
  const [stepControlHeight] = useAtom(stepControlHeightAtom);
  const [isEdit] = useAtom(isEditAtom);
  const [isDragging, setDragging] = useState(false);

  return (
    <div className="main-right">
      <Split
        className={classNames({ 'split-editor': true, dragging: isDragging })}
        direction="horizontal"
        sizes={[75, 25]}
        minSize={250}
        gutterSize={5}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: `calc(100% - ${stepControlHeight}px)`,
              display: 'flex',
              flexDirection: 'column',
            }}
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
              ) : activeFile.isFileDiff ? (
                <EditorEditDiff activeFile={activeFile} />
              ) : (
                <EditorPreviewFile activeFile={activeFile} />
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
