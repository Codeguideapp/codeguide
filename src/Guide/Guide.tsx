import './Guide.css';

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCheck,
  faFloppyDisk,
  faImage,
  faMagnifyingGlass,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { useAtom } from 'jotai';
import { last } from 'lodash';

import {
  changesAtom,
  changesOrderAtom,
  highlightChangeIdAtom,
} from '../atoms/changes';
import { setFileByPathAtom } from '../atoms/files';
import { undraftChangeAtom } from '../atoms/saveDeltaAtom';
import { DeltaPreview } from '../Shared/DeltaPreview';
import { getDeltaPreview, getFileContent } from '../utils/deltaUtils';
import { PrevNextControls } from './PrevNextControls';

library.add(faFloppyDisk, faMagnifyingGlass, faCheck, faImage, faUpload);

export function Guide() {
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [highlightChangeId, setHighlightChangeId] = useAtom(
    highlightChangeIdAtom
  );
  const [, undraftChange] = useAtom(undraftChangeAtom);
  const [, setFileByPath] = useAtom(setFileByPathAtom);

  const nonDepChanges = changesOrder
    .filter((id) => !changes[id].isFileDepChange)
    .map((id) => changes[id]);

  const lastChange = last(nonDepChanges);

  const highlightIndex = highlightChangeId
    ? changesOrder.indexOf(highlightChangeId)
    : null;

  return (
    <div className="guide">
      <div className="header">
        <div className="left"></div>
        <div className="right">
          <div className="label-icon">
            <span>Publish</span>
            <FontAwesomeIcon icon="upload" />
          </div>
        </div>
      </div>
      <div className="body">
        {nonDepChanges.map((change, index) => {
          const changeIndex = changesOrder.indexOf(change.id);

          const preview = getDeltaPreview(
            change.delta,
            getFileContent({
              upToChangeId: change.id,
              changes,
              changesOrder,
              excludeChange: true,
            }),
            '\n'
          );

          const isBeforeActive =
            highlightIndex === null ? true : changeIndex < highlightIndex;

          const isAfterActive =
            highlightIndex !== null && changeIndex > highlightIndex;

          return (
            <div
              className={classNames({
                'before-active': isBeforeActive,
                'after-active': isAfterActive,
                file: change.isFileNode,
                step: true,
                active:
                  change.id === highlightChangeId ||
                  (lastChange?.id === change.id &&
                    change.isDraft &&
                    !highlightChangeId),
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
              <div
                className={classNames({
                  'step-line-v': true,
                  first: index === 0,
                  last: lastChange?.id === change.id && change.isDraft,
                })}
              ></div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
                      {change.isDraft && (
                        <div className="icons">
                          <FontAwesomeIcon
                            icon="magnifying-glass"
                            className={classNames({
                              active: change.id === highlightChangeId,
                            })}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();

                              if (change.id === highlightChangeId) {
                                setHighlightChangeId(null);
                              } else {
                                setHighlightChangeId(change.id);
                              }
                            }}
                          />
                          <FontAwesomeIcon
                            icon="floppy-disk"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();

                              undraftChange(change.id);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {!lastChange?.isDraft && nonDepChanges.length !== 0 && (
          <div
            className={classNames({
              placeholder: true,
              step: true,
              draft: true,
              active: !highlightChangeId,
            })}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="step-line-v last"></div>
              <div className="step-circle"></div>
              <>
                <div className="step-line-h"></div>
                <div
                  className="step-code"
                  onClick={() => {
                    setHighlightChangeId(null);
                    if (lastChange) {
                      setFileByPath(lastChange.path);
                    }
                  }}
                ></div>
              </>
            </div>
          </div>
        )}
      </div>
      <div className="footer">
        <PrevNextControls />
        <div className="right">
          <Tooltip title="Add image/video step" placement="topRight">
            <FontAwesomeIcon icon="image" />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
