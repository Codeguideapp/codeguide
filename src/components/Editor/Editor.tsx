import classNames from 'classnames';
import { useMemo } from 'react';

import { BottomBarEdit } from '../BottomBar/BottomBar';
import { Comments } from '../Comments/Comments';
import { Guide } from '../Guide/Guide';
import { useActiveChange } from '../hooks/useActiveChange';
import { useShallowChanges } from '../hooks/useShallowChanges';
import { isEditing } from '../store/atoms';
import { Change, useChangesStore } from '../store/changes';
import { FileNode, useFilesStore } from '../store/files';
import { LoadingIcon } from '../svgIcons/LoadingIcon';
import { EditorEditDiff } from './EditorEditDiff';
import { EditorHighlightChange } from './EditorHighlightChange';
import { EditorPreviewFile } from './EditorPreviewFile';
import { Welcome } from './Welcome';

function GetEditorComponent({
  activeFile,
  activeChange,
}: {
  activeFile?: FileNode;
  activeChange?: Change | null;
}) {
  if (!activeFile) return <Welcome />;

  if (activeFile.isFetching)
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-900">
        <div className="-mt-20">
          <LoadingIcon />
        </div>
      </div>
    );

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

  return (
    <div className="main-right">
      <div className="flex h-full">
        <div className="relative flex w-[calc(100%_-_18rem)] flex-col">
          <div className="editor-top flex h-[30px] w-full items-center justify-between bg-zinc-900">
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
                className="ml-2 h-[8px] w-[8px] rounded-full bg-yellow-300"
                style={
                  activeFile && unsavedFilePaths.includes(activeFile.path)
                    ? { display: 'inline-block' }
                    : { display: 'none' }
                }
              ></div>
            </div>
          </div>

          <div className="flex h-full flex-col">
            <Comments />
            <div className="flex h-full grow flex-col bg-zinc-900">
              <div className="mt-2 w-full grow">
                <GetEditorComponent
                  activeFile={activeFile}
                  activeChange={activeChange}
                />
              </div>
            </div>
          </div>

          {isEditing() && <BottomBarEdit />}
        </div>

        <div className="h-full w-72">
          <Guide />
        </div>
      </div>
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
