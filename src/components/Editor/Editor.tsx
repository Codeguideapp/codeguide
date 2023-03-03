import classNames from 'classnames';
import { useMemo } from 'react';

import { BottomBarEdit } from '../BottomBar/BottomBar';
import { Comments } from '../Comments/Comments';
import { useActiveChange } from '../hooks/useActiveChange';
import { useShallowSteps } from '../hooks/useShallowSteps';
import { Steps } from '../Steps/Steps';
import { isEditing } from '../store/atoms';
import { FileNode, useFilesStore } from '../store/files';
import { Step, useStepsStore } from '../store/steps';
import { LoadingIcon } from '../svgIcons/LoadingIcon';
import { EditorEditDiff } from './EditorEditDiff';
import { EditorHighlightChange } from './EditorHighlightChange';
import { EditorPreviewFile } from './EditorPreviewFile';
import { TheEnd } from './TheEnd';
import { Welcome } from './Welcome';

function GetEditorComponent({
  activeFile,
  activeChange,
}: {
  activeFile?: FileNode;
  activeChange?: Step | null;
}) {
  const changeIds = Object.keys(useStepsStore.getState().steps);

  if (!activeFile) {
    if (changeIds.length === 0) {
      return <Welcome />;
    } else {
      return <TheEnd />;
    }
  }

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
  const getChangeIndex = useStepsStore((s) => s.getStepIndex);
  const changesNum = useStepsStore((s) => Object.keys(s.steps).length);
  let tabName = '';

  if (activeChange?.displayName) {
    tabName = activeChange.displayName;
  } else if (activeFile) {
    if (activeFile.origin === 'virtual') {
      tabName = '[Markdown Step]';
    } else {
      tabName = activeFile.path.split('/').pop() || '';
    }
  } else if (changesNum === 0) {
    tabName = 'Welcome';
  } else {
    tabName = 'The End';
  }

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
              {tabName}
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
            <div className="flex h-full grow flex-col bg-zinc-900 pt-1">
              <GetEditorComponent
                activeFile={activeFile}
                activeChange={activeChange}
              />
            </div>
          </div>

          {isEditing() && <BottomBarEdit />}
        </div>

        <div className="h-full w-72">
          <Steps />
        </div>
      </div>
    </div>
  );
}

function useUnsavedFilePaths() {
  const steps = useShallowSteps();

  return useMemo(
    () =>
      Object.values(steps)
        .filter((c) => c.isDraft)
        .map((c) => c.path),
    [steps]
  );
}
