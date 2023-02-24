import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, message, Popconfirm, Tooltip } from 'antd';
import { last } from 'lodash';
import { useState } from 'react';

import { useCommentsStore } from '../store/comments';
import { useFilesStore } from '../store/files';
import { isHighlightStep, useStepsStore } from '../store/steps';

export function StepActions() {
  const activeChange = useStepsStore((s) =>
    s.activeStepId ? s.steps[s.activeStepId] : null
  );
  const lastChange = useStepsStore((s) => {
    const lastChangeId = last(
      Object.keys(s.steps)
        .sort()
        .filter((c) => !s.steps[c].isFileDepChange)
    );
    return lastChangeId ? s.steps[lastChangeId] : null;
  });
  const setChangePreview = useStepsStore((s) => s.setStepPreview);
  const setActiveChangeId = useStepsStore((s) => s.setActiveStepId);
  const undraftChange = useStepsStore((s) => s.undraftStep);
  const deleteUntilChange = useStepsStore((s) => s.deleteUntilStep);
  const deleteChange = useStepsStore((s) => s.deleteStep);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);
  const [submitting, setSubmitting] = useState(false);
  const draftCommentPerChange = useCommentsStore((s) => s.draftCommentPerStep);
  const saveComment = useCommentsStore((s) => s.saveComment);
  const activeDraftComment = activeChange
    ? draftCommentPerChange[activeChange.id]
    : undefined;

  const handleSaveStep = () => {
    setSubmitting(true);
    if (!activeChange) return;

    if (activeChange.isDraft === false) {
      throw new Error('change is not a draft');
    }

    if (activeDraftComment) {
      saveComment();
    }

    setTimeout(() => {
      setSubmitting(false);
      undraftChange(activeChange.id);
      message.success({
        content: 'Step created successfully!',
      });
    }, 100);
  };

  const disabledDelete = Boolean(
    activeChange &&
      !isHighlightStep(activeChange) &&
      lastChange?.id !== activeChange.id
  );

  return (
    <div className="flex items-center gap-3">
      {activeChange?.isDraft && activeChange.previewOpened === false && (
        <Tooltip title="Preview Step">
          <FontAwesomeIcon
            onClick={() => {
              setChangePreview(activeChange.id, true);
            }}
            icon={faMagnifyingGlass}
            className="cursor-pointer"
          />
        </Tooltip>
      )}

      {activeChange?.previewOpened && (
        <Button
          onClick={() => {
            setChangePreview(activeChange.id, false);
          }}
          type="default"
        >
          Close Preview
        </Button>
      )}

      {(activeChange?.id !== lastChange?.id || !activeChange?.isDraft) && (
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
      {activeChange?.id === lastChange?.id && activeChange?.isDraft && (
        <Button
          disabled={!activeChange}
          htmlType="submit"
          loading={submitting}
          onClick={handleSaveStep}
          type="primary"
        >
          Create Step
        </Button>
      )}

      {activeChange && activeChange.previewOpened === false && (
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
              setActiveChangeId(null);
              if (isHighlightStep(activeChange)) {
                deleteChange(activeChange.id);
              } else {
                deleteUntilChange(activeChange.id);
              }
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button disabled={disabledDelete} danger>
              {activeChange.isDraft ? 'Discard' : 'Delete Step'}
            </Button>
          </Popconfirm>
        </Tooltip>
      )}
      {!activeChange?.isDraft && (
        <Button
          onClick={() => {
            setActiveChangeId(null);
            setActiveFileByPath(activeChange?.path);
          }}
          type="link"
        >
          Close Preview
        </Button>
      )}
    </div>
  );
}
