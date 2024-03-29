import TextArea from 'antd/lib/input/TextArea';
import { useCallback } from 'react';

import { useCommentsStore } from '../store/comments';
import { useStepsStore } from '../store/steps';

export function WriteComment() {
  const activeChangeId = useStepsStore((s) => s.activeStepId);
  const getChangeIndex = useStepsStore((s) => s.getStepIndex);
  const value = useCommentsStore((s) => {
    if (activeChangeId) {
      return s.draftCommentPerStep[activeChangeId]?.commentBody || '';
    } else {
      return '';
    }
  });
  const saveActiveCommentVal = useCommentsStore((s) => s.saveActiveCommentVal);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      saveActiveCommentVal(e.target.value);
    },
    [saveActiveCommentVal]
  );

  return (
    <TextArea
      autoSize={{
        maxRows: 5,
      }}
      style={{ borderRadius: 4, borderColor: '#303338' }}
      disabled={!activeChangeId}
      rows={1}
      onChange={handleChange}
      value={value}
      placeholder={`Write a note/explanation for step ${
        activeChangeId ? getChangeIndex(activeChangeId) : 0
      } (optional)`}
    />
  );
}
