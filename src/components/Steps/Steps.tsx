import { faCheck, faEdit, faMessage } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Input, Tooltip } from 'antd';
import classNames from 'classnames';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import scrollIntoView from 'scroll-into-view-if-needed';

import { getFileContent } from '../../utils/deltaUtils';
import { isEditing } from '../store/atoms';
import { useCommentsStore } from '../store/comments';
import { useFilesStore } from '../store/files';
import { useGuideStore } from '../store/guide';
import { Step, useStepsStore } from '../store/steps';
import { DeltaPreview } from './DeltaPreview';
import { getStepPreview, StepPreview } from './getStepPreview';

export function Steps() {
  const activeStepRef = useRef<HTMLDivElement>(null);
  const isFetching = useGuideStore((s) => s.isFetching);
  const fileRefs = useGuideStore((s) => s.fileRefs);
  const setActiveStepId = useStepsStore((s) => s.setActiveStepId);
  const getStepIndex = useStepsStore((s) => s.getStepIndex);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);
  const activeStepId = useStepsStore((s) => s.activeStepId);
  const updateStepProps = useStepsStore((s) => s.updateStepProps);
  const savedComments = useCommentsStore((s) => s.savedComments);
  const steps = useStepsStore((s) => {
    const stepsOrder = Object.keys(s.steps).sort();
    const activeStepIndex = s.activeStepId
      ? stepsOrder.indexOf(s.activeStepId)
      : null;

    const steps = stepsOrder
      .filter((id) => !s.steps[id].isFileDepChange)
      .map((id) => s.steps[id]);

    const resultSteps: {
      isFileNode: boolean;
      id: string;
      isDraft: boolean;
      preview?: StepPreview;
      isBeforeActive: boolean;
      isAfterActive: boolean;
      active: boolean;
      isVirtualFile: boolean;
      step: Step;
    }[] = steps[0]
      ? [
          {
            isFileNode: true,
            id: nanoid(),
            isBeforeActive: true,
            isAfterActive: false,
            active: false,
            isDraft: false,
            isVirtualFile:
              fileRefs.find((f) => f.path === steps[0].path)?.origin ===
              'virtual',
            step: steps[0],
          },
        ]
      : [];

    let lasFile = steps[0]?.path;

    for (const step of steps) {
      const stepIndex = stepsOrder.indexOf(step.id);
      const fileRef = fileRefs.find((f) => f.path === step.path);

      if (lasFile !== step.path) {
        resultSteps.push({
          isFileNode: true,
          id: nanoid(),
          isDraft: false,
          isBeforeActive:
            activeStepIndex === null ? true : stepIndex < activeStepIndex,
          isAfterActive:
            activeStepIndex !== null && stepIndex > activeStepIndex,
          active: false,
          isVirtualFile: fileRef?.origin === 'virtual',
          step,
        });
        lasFile = step.path;
      }

      const preview = getStepPreview({
        delta: step.delta,
        before: getFileContent({
          upToStepId: step.id,
          changes: s.steps,
          excludeChange: true,
        }),
        after: getFileContent({
          upToStepId: step.id,
          changes: s.steps,
          excludeChange: false,
        }),
        selections: step.highlight,
      });

      resultSteps.push({
        isFileNode: false,
        id: step.id,
        isDraft: step.isDraft,
        preview,
        isBeforeActive:
          activeStepIndex === null ? true : stepIndex < activeStepIndex,
        isAfterActive: activeStepIndex !== null && stepIndex > activeStepIndex,
        active: step.id === s.activeStepId,
        isVirtualFile: fileRef?.origin === 'virtual',
        step,
      });
    }

    return resultSteps;
  });

  useEffect(() => {
    if (!activeStepRef.current) return;

    scrollIntoView(activeStepRef.current, {
      scrollMode: 'if-needed',
      block: 'center',
    });
  }, [activeStepId, getStepIndex]);

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
            id,
            isDraft,
            isBeforeActive,
            isAfterActive,
            active,
            preview,
            isFileNode,
            isVirtualFile,
            step,
          }) => {
            return (
              <div
                ref={active ? activeStepRef : null}
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
                  setActiveFileByPath(step.path);
                  setActiveStepId(id);
                }}
              >
                <div className="step-line-v"></div>
                <div className="relative flex items-center">
                  <div className="step-circle">
                    <span style={{ display: isDraft ? 'none' : 'block' }}>
                      {isBeforeActive && <FontAwesomeIcon icon={faCheck} />}
                    </span>
                  </div>

                  {isFileNode ? (
                    isEditing() && isVirtualFile ? (
                      <Input
                        size="small"
                        placeholder="[Markdown step]"
                        defaultValue={step.displayName}
                        suffix={<FontAwesomeIcon icon={faEdit} size="xs" />}
                        style={{
                          border: '1px solid #28282b',
                          marginLeft: 12,
                          marginRight: 8,
                          fontFamily: 'Inconsolata',
                          fontSize: 14,
                        }}
                        onBlur={(e) => {
                          updateStepProps(step.id, {
                            displayName: e.target.value,
                          });
                        }}
                      />
                    ) : (
                      <div className="step-file">
                        {step.displayName || step.path.split('/').pop()}
                      </div>
                    )
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
            ref={!activeStepId ? activeStepRef : null}
            className={classNames({
              placeholder: true,
              step: true,
              draft: true,
              active: !activeStepId,
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
                    setActiveStepId(null);
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
