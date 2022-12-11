import { faMagnifyingGlass, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, message, Popconfirm, Tooltip } from 'antd';
import { useAtom } from 'jotai';
import { last } from 'lodash';
import { useState } from 'react';

import { useChangesStore } from '../store/changes';
import { useCommentsStore } from '../store/comments';

export function StepActions() {
  const activeChange = useChangesStore((s) =>
    s.activeChangeId ? s.changes[s.activeChangeId] : null
  );
  const lastChangeId = useChangesStore((s) =>
    last(Object.keys(s.changes).sort())
  );
  const setChangePreview = useChangesStore((s) => s.setChangePreview);
  const setActiveChangeId = useChangesStore((s) => s.setActiveChangeId);
  const undraftChange = useChangesStore((s) => s.undraftChange);
  const deleteChange = useChangesStore((s) => s.deleteChange);
  const [submitting, setSubmitting] = useState(false);
  const stagedComments = useCommentsStore((s) => s.stagedComments);
  const createNewComment = useCommentsStore((s) => s.createNewComment);

  const handleSaveStep = () => {
    setSubmitting(true);
    if (!activeChange) return;

    if (activeChange.isDraft === false) {
      throw new Error('change is not a draft');
    }

    if (stagedComments[activeChange.id]) {
      createNewComment();
    }

    setTimeout(() => {
      setSubmitting(false);
      undraftChange(activeChange.id);
      message.success({
        content: 'Step created successfully!',
      });
    }, 100);
  };

  return (
    <div className="flex gap-3 items-center">
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

      {activeChange && activeChange.previewOpened === false && (
        <Tooltip
          title={
            lastChangeId !== activeChange?.id
              ? 'Only last step can be deleted'
              : activeChange?.id
              ? 'Delete Step'
              : 'Discard'
          }
        >
          <Popconfirm
            disabled={lastChangeId !== activeChange?.id}
            title="Are you sure you want to delete this step?"
            onConfirm={() => {
              setActiveChangeId(null);
              deleteChange(activeChange.id);
            }}
            okText="Yes"
            cancelText="No"
          >
            <FontAwesomeIcon
              icon={faTrash}
              className={
                lastChangeId !== activeChange.id
                  ? 'opacity-20'
                  : 'cursor-pointer'
              }
            />
          </Popconfirm>
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

      {activeChange?.id === lastChangeId && activeChange?.isDraft ? (
        <Button
          disabled={!activeChange}
          htmlType="submit"
          loading={submitting}
          onClick={handleSaveStep}
          type="primary"
        >
          Create Step
        </Button>
      ) : (
        <Button
          disabled={!activeChange}
          htmlType="submit"
          loading={submitting}
          onClick={createNewComment}
          type="primary"
        >
          Add Comment
        </Button>
      )}
    </div>
  );
}
