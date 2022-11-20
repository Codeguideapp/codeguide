import { Button, Popconfirm, Tooltip } from 'antd';
import { useAtom } from 'jotai';
import { last } from 'lodash';
import { useMemo, useState } from 'react';

import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
  deleteChangeAtom,
  highlightChangeIdAtom,
  undraftChangeAtom,
} from '../atoms/changes';
import { createNewCommentAtom, draftCommentsAtom } from '../atoms/comments';

export function StepActions() {
  const [highlightChangeId, setHighlightChangeId] = useAtom(
    highlightChangeIdAtom
  );
  const [submitting, setSubmitting] = useState(false);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [activeChangeId] = useAtom(activeChangeIdAtom);
  const [changes] = useAtom(changesAtom);
  const [, undraftChange] = useAtom(undraftChangeAtom);
  const [draftComments] = useAtom(draftCommentsAtom);
  const [, deleteChange] = useAtom(deleteChangeAtom);

  const handleSaveStep = () => {
    setSubmitting(true);
    if (!activeChangeId) return;

    if (draftComments[activeChangeId]) {
      createNewComment();
    }

    setTimeout(() => {
      setSubmitting(false);
      undraftChange(activeChangeId);
    }, 100);
  };
  const [, createNewComment] = useAtom(createNewCommentAtom);

  const isLastChangePreview =
    last(changesOrder) === highlightChangeId &&
    changes[highlightChangeId].isDraft;

  const commentValue = useMemo(() => {
    const changeId = highlightChangeId || activeChangeId;
    return changeId ? draftComments[changeId] || '' : '';
  }, [highlightChangeId, activeChangeId, draftComments]);

  if (commentValue) {
    return (
      <Button
        disabled={!activeChangeId}
        type="default"
        onClick={() => createNewComment()}
      >
        Add a Comment
      </Button>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {activeChangeId && !isLastChangePreview && (
        <Tooltip
          title={
            last(changesOrder) !== activeChangeId
              ? 'Only last step can be deleted'
              : ''
          }
        >
          <Popconfirm
            title="Are you sure you want to delete this step?"
            onConfirm={() => {
              setHighlightChangeId(null);
              deleteChange(activeChangeId);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button
              disabled={last(changesOrder) !== activeChangeId}
              htmlType="submit"
              danger
              type="primary"
            >
              {highlightChangeId ? 'Delete Step' : 'Discard'}
            </Button>
          </Popconfirm>
        </Tooltip>
      )}

      {!highlightChangeId && (
        <Button
          disabled={!activeChangeId}
          onClick={() => {
            setHighlightChangeId(activeChangeId);
          }}
          type="default"
        >
          Preview
        </Button>
      )}
      {highlightChangeId && isLastChangePreview && (
        <Button
          onClick={() => {
            setHighlightChangeId(null);
          }}
          type="default"
        >
          Close Preview
        </Button>
      )}

      {!highlightChangeId && (
        <Button
          disabled={!activeChangeId}
          htmlType="submit"
          loading={submitting}
          onClick={handleSaveStep}
          type="primary"
        >
          Create Step
        </Button>
      )}
    </div>
  );
}
