import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Checkbox, message, Popconfirm, Tooltip } from 'antd';
import { last } from 'lodash';
import { useState } from 'react';

import { useCommentsStore } from '../store/comments';
import { useFilesStore } from '../store/files';
import { isHighlightStep, useStepsStore } from '../store/steps';

export function StepActions() {
  const activeStep = useStepsStore((s) =>
    s.activeStepId ? s.steps[s.activeStepId] : null
  );
  const lastStep = useStepsStore((s) => {
    const lastStepId = last(
      Object.keys(s.steps)
        .sort()
        .filter((c) => !s.steps[c].isFileDepChange)
    );
    return lastStepId ? s.steps[lastStepId] : null;
  });
  const previousStep = useStepsStore((s) => {
    const stepIds = Object.keys(s.steps)
      .sort()
      .filter((c) => !s.steps[c].isFileDepChange);

    if (!s.activeStepId) return null;
    const activeIndex = stepIds.indexOf(s.activeStepId);

    if (activeIndex === 0) return null;

    const previousId = stepIds[activeIndex - 1];
    return s.steps[previousId];
  });
  const setStepPreview = useStepsStore((s) => s.setStepPreview);
  const setActiveStepId = useStepsStore((s) => s.setActiveStepId);
  const undraftStep = useStepsStore((s) => s.undraftStep);
  const updateStepProps = useStepsStore((s) => s.updateStepProps);
  const deleteUntilChange = useStepsStore((s) => s.deleteUntilStep);
  const deleteChange = useStepsStore((s) => s.deleteStep);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);
  const [submitting, setSubmitting] = useState(false);
  const draftCommentPerChange = useCommentsStore((s) => s.draftCommentPerStep);
  const saveComment = useCommentsStore((s) => s.saveComment);
  const activeDraftComment = activeStep
    ? draftCommentPerChange[activeStep.id]
    : undefined;

  const handleSaveStep = () => {
    setSubmitting(true);
    if (!activeStep) return;

    if (activeStep.isDraft === false) {
      throw new Error('change is not a draft');
    }

    if (activeDraftComment) {
      saveComment();
    }

    setTimeout(() => {
      setSubmitting(false);
      undraftStep(activeStep.id);
      message.success({
        content: 'Step created successfully!',
      });
    }, 100);
  };

  const disabledDelete = Boolean(
    activeStep && !isHighlightStep(activeStep) && lastStep?.id !== activeStep.id
  );

  return (
    <div className="step-actions flex items-center gap-2">
      {activeStep?.isDraft && activeStep.previewOpened === false && (
        <Tooltip title="Preview Step">
          <FontAwesomeIcon
            onClick={() => {
              setStepPreview(activeStep.id, true);
            }}
            icon={faMagnifyingGlass}
            className="cursor-pointer"
          />
        </Tooltip>
      )}

      {activeStep?.previewOpened && (
        <Button
          onClick={() => {
            setStepPreview(activeStep.id, false);
          }}
          type="default"
        >
          Close Preview
        </Button>
      )}

      {(activeStep?.id !== lastStep?.id || !activeStep?.isDraft) && (
        <Button
          disabled={!activeDraftComment?.commentBody}
          htmlType="submit"
          loading={submitting}
          onClick={saveComment}
          type="primary"
        >
          {activeDraftComment?.isEditing ? 'Edit Comment' : 'Add Comment'}
        </Button>
      )}
      {activeStep?.id === lastStep?.id && activeStep?.isDraft && (
        <Button
          disabled={!activeStep}
          htmlType="submit"
          loading={submitting}
          onClick={handleSaveStep}
          type="primary"
        >
          Create Step
        </Button>
      )}

      {activeStep && activeStep.previewOpened === false && (
        <Tooltip
          title={
            disabledDelete
              ? 'Only the last step with code changes can be deleted'
              : ''
          }
        >
          <Popconfirm
            disabled={disabledDelete}
            title="Are you sure you want to delete this step?"
            onConfirm={() => {
              setActiveStepId(null);
              if (isHighlightStep(activeStep)) {
                deleteChange(activeStep.id);
              } else {
                deleteUntilChange(activeStep.id);
              }
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button disabled={disabledDelete} danger>
              {activeStep.isDraft ? 'Discard' : 'Delete Step'}
            </Button>
          </Popconfirm>
        </Tooltip>
      )}
      {!activeStep?.isDraft && (
        <Button
          onClick={() => {
            setActiveStepId(null);
            setActiveFileByPath(activeStep?.path);
          }}
          type="link"
        >
          Close Preview
        </Button>
      )}
      {activeStep?.isDraft && (!previousStep || previousStep.introStep) && (
        <Tooltip title="todo">
          <Checkbox
            checked={activeStep.introStep}
            onChange={(e) => {
              updateStepProps(activeStep.id, { introStep: e.target.checked });
            }}
          >
            Intro
          </Checkbox>
        </Tooltip>
      )}
      {activeStep?.isDraft &&
        activeStep.path.split('.').pop()?.toLowerCase() === 'md' && (
          <Tooltip title="Display step as HTML rather than markdown">
            <Checkbox
              checked={activeStep.renderHtml}
              onChange={(e) =>
                updateStepProps(activeStep.id, { renderHtml: e.target.checked })
              }
            >
              HTML
            </Checkbox>
          </Tooltip>
        )}
    </div>
  );
}
