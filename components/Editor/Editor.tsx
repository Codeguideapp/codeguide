import classNames from 'classnames';
import { useAtom } from 'jotai';
import { useMemo, useState } from 'react';
import Split from 'react-split';

import { BottomBar } from '../BottomBar/BottomBar';
import { Guide } from '../Guide/Guide';
import { useActiveChange } from '../hooks/useActiveChange';
import { useShallowChanges } from '../hooks/useShallowChanges';
import { stepControlHeightAtom } from '../store/atoms';
import { useChangesStore } from '../store/changes';
import { useFilesStore } from '../store/files';
import { EditorEditDiff } from './EditorEditDiff';
import { EditorHighlightChange } from './EditorHighlightChange';
import { EditorPreviewFile } from './EditorPreviewFile';
import { EditorToolbar } from './EditorToolbar';
import { Welcome } from './Welcome';

export function Editor() {
  const activeChange = useActiveChange();
  const activeFile = useFilesStore((s) => s.activeFile);
  const unsavedFilePaths = useUnsavedFilePaths();
  const getChangeIndex = useChangesStore((s) => s.getChangeIndex);
  const [stepControlHeight] = useAtom(stepControlHeightAtom);
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
                  'in-past': Boolean(activeChange),
                })}
              >
                {activeFile ? activeFile?.path.split('/').pop() : 'Welcome'}
                {activeChange
                  ? `  (step ${getChangeIndex(activeChange.id)})`
                  : ''}
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
              ) : activeChange?.isDraft === false ||
                activeChange?.previewOpened ? (
                <EditorHighlightChange changeId={activeChange.id} />
              ) : activeFile.isFileDiff ? (
                <EditorEditDiff activeFile={activeFile} />
              ) : (
                <EditorPreviewFile activeFile={activeFile} />
              )}
            </div>
          </div>
          <BottomBar />
        </div>

        <Guide />
      </Split>
    </div>
  );
}

function useUnsavedFilePaths() {
  const changes = useShallowChanges();

  return useMemo(
    () =>
      Object.values(changes)
        .filter((c) => c.isDraft)
        .map((c) => c.path),
    [changes]
  );
}
