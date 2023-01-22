import classNames from 'classnames';
import { useAtom } from 'jotai';
import { useMemo, useState } from 'react';
import Split from 'react-split';

import { BottomBarEdit } from '../BottomBar/BottomBar';
import { Comments } from '../Comments/Comments';
import { Guide } from '../Guide/Guide';
import { useActiveChange } from '../hooks/useActiveChange';
import { useShallowChanges } from '../hooks/useShallowChanges';
import { isEditing, stepControlHeightAtom } from '../store/atoms';
import { Change, useChangesStore } from '../store/changes';
import { FileNode, useFilesStore } from '../store/files';
import { EditorEditDiff } from './EditorEditDiff';
import { EditorHighlightChange } from './EditorHighlightChange';
import { EditorPreviewFile } from './EditorPreviewFile';
import { EditorToolbar } from './EditorToolbar';
import { Welcome } from './Welcome';

function GetEditorComponent({
  activeFile,
  activeChange,
}: {
  activeFile?: FileNode;
  activeChange?: Change | null;
}) {
  if (!activeFile) return <Welcome />;

  if (activeChange && activeChange.path !== activeFile.path) {
    return (
      <EditorPreviewFile
        activeFile={activeFile}
        upToChangeId={activeChange.id}
      />
    );
  }

  if (activeChange?.isDraft === false || activeChange?.previewOpened) {
    return <EditorHighlightChange changeId={activeChange.id} />;
  }

  if (activeFile.isFileDiff && isEditing()) {
    return <EditorEditDiff activeFile={activeFile} />;
  }

  return <EditorPreviewFile activeFile={activeFile} />;
}

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

          <Comments />
          <div
            className="flex flex-col bg-zinc-900"
            style={{
              marginTop: stepControlHeight,
              height: `calc(100% - ${stepControlHeight}px)`,
            }}
          >
            <div className="mt-2 w-full grow">
              <GetEditorComponent
                activeFile={activeFile}
                activeChange={activeChange}
              />
            </div>
          </div>
          {isEditing() && <BottomBarEdit />}
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
