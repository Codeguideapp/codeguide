import { faMagnifyingGlass, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, message, Popconfirm, Tooltip } from 'antd';
import { last } from 'lodash';
import { useState } from 'react';

import { isEditing } from '../store/atoms';
import { isHighlightChange, useChangesStore } from '../store/changes';
import { useCommentsStore } from '../store/comments';

export function StepActions() {
  const activeChange = useChangesStore((s) =>
    s.activeChangeId ? s.changes[s.activeChangeId] : null
  );
  const lastChange = useChangesStore((s) => {
    const lastChangeId = last(
      Object.keys(s.changes)
        .sort()
        .filter(
          (c) => !s.changes[c].isFileDepChange && !s.changes[c].isFileNode
        )
    );
    return lastChangeId ? s.changes[lastChangeId] : null;
  });
  const setChangePreview = useChangesStore((s) => s.setChangePreview);
  const setActiveChangeId = useChangesStore((s) => s.setActiveChangeId);
  const undraftChange = useChangesStore((s) => s.undraftChange);
  const deleteUntilChange = useChangesStore((s) => s.deleteUntilChange);
  const deleteChange = useChangesStore((s) => s.deleteChange);
  const [submitting, setSubmitting] = useState(false);
  const draftCommentPerChange = useCommentsStore(
    (s) => s.draftCommentPerChange
  );
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
      !isHighlightChange(activeChange) &&
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
              if (isHighlightChange(activeChange)) {
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
    </div>
  );
}
