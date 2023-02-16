import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCheck,
  faImage,
  faMessage,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import scrollIntoView from 'scroll-into-view-if-needed';

import { getFileContent } from '../../utils/deltaUtils';
import { isEditing } from '../store/atoms';
import { useChangesStore } from '../store/changes';
import { useCommentsStore } from '../store/comments';
import { useFilesStore } from '../store/files';
import { useGuideStore } from '../store/guide';
import { DeltaPreview } from './DeltaPreview';
import { getStepPreview, StepPreview } from './getStepPreview';

library.add(faCheck, faImage, faUpload);

export function Steps() {
  const activeChangeRef = useRef<HTMLDivElement>(null);
  const isFetching = useGuideStore((s) => s.isFetching);
  const setActiveChangeId = useChangesStore((s) => s.setActiveChangeId);
  const getChangeIndex = useChangesStore((s) => s.getChangeIndex);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);
  const activeChangeId = useChangesStore((s) => s.activeChangeId);
  const savedComments = useCommentsStore((s) => s.savedComments);
  const steps = useChangesStore((s) => {
    const changesOrder = Object.keys(s.changes).sort();
    const activeChangeIndex = s.activeChangeId
      ? changesOrder.indexOf(s.activeChangeId)
      : null;

    const changes = changesOrder
      .filter((id) => !s.changes[id].isFileDepChange)
      .map((id) => s.changes[id]);

    const resultSteps: {
      isFileNode: boolean;
      path: string;
      id: string;
      isDraft: boolean;
      preview?: StepPreview;
      isBeforeActive: boolean;
      isAfterActive: boolean;
      active: boolean;
    }[] = changes[0]
      ? [
          {
            isFileNode: true,
            id: nanoid(),
            path: changes[0].path,
            isBeforeActive: true,
            isAfterActive: false,
            active: false,
            isDraft: false,
          },
        ]
      : [];

    let lasFile = changes[0]?.path;

    for (const change of changes) {
      const changeIndex = changesOrder.indexOf(change.id);

      if (lasFile !== change.path) {
        resultSteps.push({
          isFileNode: true,
          id: nanoid(),
          isDraft: false,
          path: change.path,
          isBeforeActive:
            activeChangeIndex === null ? true : changeIndex < activeChangeIndex,
          isAfterActive:
            activeChangeIndex !== null && changeIndex > activeChangeIndex,
          active: false,
        });
        lasFile = change.path;
      }

      const preview = getStepPreview({
        delta: change.delta,
        before: getFileContent({
          upToChangeId: change.id,
          changes: s.changes,
          excludeChange: true,
        }),
        after: getFileContent({
          upToChangeId: change.id,
          changes: s.changes,
          excludeChange: false,
        }),
        selections: change.highlight,
      });

      resultSteps.push({
        isFileNode: false,
        id: change.id,
        path: change.path,
        isDraft: change.isDraft,
        preview,
        isBeforeActive:
          activeChangeIndex === null ? true : changeIndex < activeChangeIndex,
        isAfterActive:
          activeChangeIndex !== null && changeIndex > activeChangeIndex,
        active: change.id === s.activeChangeId,
      });
    }

    return resultSteps;
  });

  useEffect(() => {
    if (!activeChangeRef.current) return;

    scrollIntoView(activeChangeRef.current, {
      scrollMode: 'if-needed',
      block: 'center',
    });
  }, [activeChangeId, getChangeIndex]);

  if (isFetching) {
    return <div className="steps h-full p-4">Loading...</div>;
  }
  if (isEditing() && steps.length === 0) {
    return <div className="steps h-full p-4">No steps saved...</div>;
  }

  if (
    !isEditing() &&
    (steps.length === 0 || (steps.length === 1 && steps[0]?.isFileNode))
  ) {
    return (
      <div className="steps h-full p-4">
        <p className="pb-4">The guide is empty...</p>
        <p>
          If you are the author of the guide, you can add steps in the{' '}
          <Link className="font-bold" href={'/edit'}>
            edit mode
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="steps h-full overflow-auto">
      <div className="body">
        {steps.map(
          ({
            path,
            id,
            isDraft,
            isBeforeActive,
            isAfterActive,
            active,
            preview,
            isFileNode,
          }) => {
            return (
              <div
                ref={active ? activeChangeRef : null}
                className={classNames({
                  'before-active': isBeforeActive,
                  'after-active': isAfterActive,
                  file: isFileNode,
                  step: true,
                  active,
                  draft: isDraft,
                })}
                key={id}
                onClick={() => {
                  if (isFileNode) return;
                  setActiveFileByPath(path);
                  setActiveChangeId(id);
                }}
              >
                <div className="step-line-v"></div>
                <div className="relative flex items-center">
                  <div className="step-circle">
                    <span style={{ display: isDraft ? 'none' : 'block' }}>
                      {isBeforeActive && <FontAwesomeIcon icon="check" />}
                    </span>
                  </div>

                  {isFileNode ? (
                    <div className="step-file">{path.split('/').pop()}</div>
                  ) : (
                    <>
                      <div className="step-line-h"></div>
                      <div className="step-code">
                        {preview && <DeltaPreview preview={preview} />}
                      </div>
                    </>
                  )}

                  {!isFileNode && (
                    <div
                      style={{ height: 'calc(100% - 2px)' }}
                      className={
                        'absolute right-3 px-2 ' +
                        (isBeforeActive ? 'bg-[#2c3035]' : 'bg-[#24262a]')
                      }
                    >
                      <div
                        className={
                          'flex h-full items-center gap-2 text-zinc-400 ' +
                          (isBeforeActive ? 'opacity-60' : 'opacity-30')
                        }
                      >
                        {savedComments[id] && (
                          <FontAwesomeIcon
                            title={'Comments: ' + savedComments[id].length}
                            style={{ fontSize: 12 }}
                            icon={faMessage}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }
        )}

        {steps.length !== 0 && (
          <div
            className={classNames({
              placeholder: true,
              step: true,
              draft: true,
              active: !activeChangeId,
            })}
          >
            <div className="flex items-center pt-4">
              <div className="step-line-v last"></div>
              <div className="step-circle"></div>
              <>
                <div className="step-line-h"></div>
                <div
                  className="step-code"
                  onClick={() => {
                    setActiveChangeId(null);
                    if (!isEditing()) {
                      setActiveFileByPath(undefined);
                    }
                  }}
                ></div>
              </>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
