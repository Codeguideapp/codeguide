import { Button } from 'antd';
import { useAtom } from 'jotai';
import { useState } from 'react';

import { activeChangeIdAtom, highlightChangeIdAtom } from '../atoms/changes';
import { createNewCommentAtom } from '../atoms/notes';

export function StepActions() {
  const [highlightChangeId] = useAtom(highlightChangeIdAtom);
  const [submitting, setSubmitting] = useState(false);
  const [activeChangeId] = useAtom(activeChangeIdAtom);

  const handleSubmit = () => {
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      createNewComment();
    }, 1000);
  };
  const [, createNewComment] = useAtom(createNewCommentAtom);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button
        disabled={!activeChangeId}
        type={highlightChangeId ? 'link' : 'default'}
      >
        Add a Comment
      </Button>
      <div>
        <Button
          disabled={!activeChangeId}
          htmlType="submit"
          loading={submitting}
          onClick={handleSubmit}
          type="link"
        >
          Preview
        </Button>
        <Button
          disabled={!activeChangeId}
          htmlType="submit"
          loading={submitting}
          onClick={handleSubmit}
          type="primary"
        >
          Create Step
        </Button>
      </div>
    </div>
  );
}
