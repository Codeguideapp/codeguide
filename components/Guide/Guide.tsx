import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCheck,
  faImage,
  faMessage,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { useAtom } from 'jotai';
import { useMemo } from 'react';

import {
  activeChangeIdAtom,
  changesAtom,
  highlightChangeIdAtom,
} from '../atoms/changes';
import { savedCommentsAtom } from '../atoms/comments';
import { setActiveFileByPathAtom } from '../atoms/files';
import { DeltaPreview } from '../Shared/DeltaPreview';
import { getFileContent } from '../utils/deltaUtils';
import { getStepPreview } from './getStepPreview';

library.add(faCheck, faImage, faUpload);

export function Guide() {
  const [changes] = useAtom(changesAtom);
  const [activeChangeId] = useAtom(activeChangeIdAtom);
  const [savedComments] = useAtom(savedCommentsAtom);
  const [, setHighlightChangeId] = useAtom(highlightChangeIdAtom);
  const [, setFileByPath] = useAtom(setActiveFileByPathAtom);
  const changesOrder = useMemo(() => Object.keys(changes).sort(), [changes]);

  const nonDepChanges = changesOrder
    .filter((id) => !changes[id].isFileDepChange)
    .map((id) => changes[id]);

  const activeChangeIndex = activeChangeId
    ? changesOrder.indexOf(activeChangeId)
    : null;

  if (nonDepChanges.length === 0) {
    return <div className="guide"></div>;
  }

  const lastChange = nonDepChanges[nonDepChanges.length - 1];

  return (
    <div className="guide">
      <div className="body">
        {nonDepChanges.map((change) => {
          const changeIndex = changesOrder.indexOf(change.id);

          const preview = getStepPreview({
            delta: change.delta,
            before: getFileContent({
              upToChangeId: change.id,
              changes,
              excludeChange: true,
            }),
            after: getFileContent({
              upToChangeId: change.id,
              changes,
              excludeChange: false,
            }),
            selections: change.highlight,
          });

          const isBeforeActive =
            activeChangeIndex === null ? true : changeIndex < activeChangeIndex;

          const isAfterActive =
            activeChangeIndex !== null && changeIndex > activeChangeIndex;

          return (
            <div
              className={classNames({
                'before-active': isBeforeActive,
                'after-active': isAfterActive,
                file: change.isFileNode,
                step: true,
                active: change.id === activeChangeId,
                draft: change.isDraft,
              })}
              key={change.id}
              onClick={() => {
                if (change.isFileNode) return;

                if (change.isDraft) {
                  setHighlightChangeId(null);
                } else {
                  setHighlightChangeId(change.id);
                }

                setFileByPath(change.path);
              }}
            >
              <div className="step-line-v"></div>
              <div className="flex items-center relative">
                <div className="step-circle">
                  <span style={{ display: change.isDraft ? 'none' : 'block' }}>
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
                {savedComments[change.id] && (
                  <div
                    title={savedComments[change.id].length + ' comments'}
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
        })}

        {!lastChange.isDraft && (
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
                    setHighlightChangeId(null);
                    setFileByPath(lastChange.path);
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
