import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCheck,
  faImage,
  faMessage,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
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
import { getStepPreview } from './getStepPreview';

library.add(faCheck, faImage, faUpload);

export function Steps() {
  const activeChangeRef = useRef<HTMLDivElement>(null);
  const isFetching = useGuideStore((s) => s.isFetching);
  const setActiveChangeId = useChangesStore((s) => s.setActiveChangeId);
  const getChangeIndex = useChangesStore((s) => s.getChangeIndex);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);
  const activeChangeId = useChangesStore((s) => s.activeChangeId);
  const savedComments = useCommentsStore((s) => s.savedComments);
  const changesForGuide = useChangesStore((s) => {
    const changesOrder = Object.keys(s.changes).sort();
    const activeChangeIndex = s.activeChangeId
      ? changesOrder.indexOf(s.activeChangeId)
      : null;

    return changesOrder
      .filter((id) => !s.changes[id].isFileDepChange)
      .map((id) => s.changes[id])
      .map((change) => {
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

        const changeIndex = changesOrder.indexOf(change.id);

        return {
          change,
          preview,
          isBeforeActive:
            activeChangeIndex === null ? true : changeIndex < activeChangeIndex,
          isAfterActive:
            activeChangeIndex !== null && changeIndex > activeChangeIndex,
          active: change.id === s.activeChangeId,
        };
      });
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
  if (isEditing() && changesForGuide.length === 0) {
    return <div className="steps h-full p-4">No steps saved...</div>;
  }

  if (
    !isEditing() &&
    (changesForGuide.length === 0 ||
      (changesForGuide.length === 1 && changesForGuide[0]?.change.isFileNode))
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

  const lastChange = changesForGuide[changesForGuide.length - 1];

  if (lastChange.change.isFileNode) {
    changesForGuide.pop();
  }

  return (
    <div className="steps h-full overflow-auto">
      <div className="body">
        {changesForGuide.map(
          ({ change, isBeforeActive, isAfterActive, active, preview }, i) => {
            return (
              <div
                ref={active ? activeChangeRef : null}
                className={classNames({
                  'before-active': isBeforeActive,
                  'after-active': isAfterActive,
                  file: change.isFileNode,
                  step: true,
                  active,
                  draft: change.isDraft,
                })}
                key={change.id}
                onClick={() => {
                  if (change.isFileNode) return;
                  setActiveFileByPath(change.path);
                  setActiveChangeId(change.id);
                }}
              >
                <div className="step-line-v"></div>
                <div className="relative flex items-center">
                  <div className="step-circle">
                    <span
                      style={{ display: change.isDraft ? 'none' : 'block' }}
                    >
                      {isBeforeActive && <FontAwesomeIcon icon="check" />}
                    </span>
                  </div>

                  {change.isFileNode ? (
                    <div className="step-file">
                      {change.path.split('/').pop()}
                    </div>
                  ) : (
                    <>
                      <div className="step-line-h"></div>
                      <div className="step-code">
                        <DeltaPreview preview={preview} />
                      </div>
                    </>
                  )}

                  {!change.isFileNode && (
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
                        {savedComments[change.id] && (
                          <FontAwesomeIcon
                            title={
                              'Comments: ' + savedComments[change.id].length
                            }
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
      </div>
    </div>
  );
}