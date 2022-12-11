import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCheck,
  faImage,
  faMessage,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { useMemo } from 'react';

import { getFileContent } from '../../utils/deltaUtils';
import { useChangesStore } from '../store/changes';
import { useCommentsStore } from '../store/comments';
import { useFilesStore } from '../store/files';
import { DeltaPreview } from './DeltaPreview';
import { getStepPreview } from './getStepPreview';

library.add(faCheck, faImage, faUpload);

export function Guide() {
  const setActiveChangeId = useChangesStore((s) => s.setActiveChangeId);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);
  const activeChangeId = useChangesStore((s) => s.activeChangeId);
  const committedComments = useCommentsStore((s) => s.committedComments);
  const changes = useChangesStore((s) => s.changes);
  const changesForGuide = useMemo(() => {
    const changesOrder = Object.keys(changes).sort();
    const activeChangeIndex = activeChangeId
      ? changesOrder.indexOf(activeChangeId)
      : null;

    return Object.keys(changes)
      .sort()
      .filter((id) => !changes[id].isFileDepChange)
      .map((id) => changes[id])
      .map((change) => {
        const preview = getStepPreview({
          delta: change.delta,
          before: getFileContent({
            upToChangeId: change.id,
            changes: changes,
            excludeChange: true,
          }),
          after: getFileContent({
            upToChangeId: change.id,
            changes: changes,
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
          active: change.id === activeChangeId,
        };
      });
  }, [changes, activeChangeId]);

  if (changesForGuide.length === 0) {
    return <div className="guide"></div>;
  }

  const lastChange = changesForGuide[changesForGuide.length - 1];

  return (
    <div className="guide">
      <div className="body">
        {changesForGuide.map(
          ({ change, isBeforeActive, isAfterActive, active, preview }) => {
            return (
              <div
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

                  setActiveChangeId(change.id);
                  setActiveFileByPath(change.path);
                }}
              >
                <div className="step-line-v"></div>
                <div className="flex items-center relative">
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
                  {committedComments[change.id] && (
                    <div
                      title={committedComments[change.id].length + ' comments'}
                      style={{ height: 'calc(100% - 2px)' }}
                      className={
                        'absolute right-3 px-2 ' +
                        (isBeforeActive ? 'bg-[#2c3035]' : 'bg-[#24262a]')
                      }
                    >
                      <div
                        className={
                          'text-zinc-400 h-full flex items-center ' +
                          (isBeforeActive ? 'opacity-60' : 'opacity-30')
                        }
                      >
                        <FontAwesomeIcon
                          style={{ fontSize: 12 }}
                          icon={faMessage}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }
        )}

        {!lastChange.change.isDraft && (
          <div
            className={classNames({
              placeholder: true,
              step: true,
              draft: true,
              active: !activeChangeId,
            })}
          >
            <div className="flex items-center">
              <div className="step-line-v last"></div>
              <div className="step-circle"></div>
              <>
                <div className="step-line-h"></div>
                <div
                  className="step-code"
                  onClick={() => {
                    setActiveChangeId(null);
                    setActiveFileByPath(lastChange.change.path);
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
