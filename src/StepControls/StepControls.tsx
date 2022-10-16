import './StepControls.css';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import { useAtom } from 'jotai';
import { useMemo } from 'react';

import { activeChangeIdAtom, highlightChangeIdAtom } from '../atoms/changes';
import { savedCommentsAtom } from '../atoms/comments';
import { PreviewComment } from './PreviewComment';
import { WriteComment } from './WriteComment';

library.add(faComment);

export function StepControls() {
  const [highlightChangeId] = useAtom(highlightChangeIdAtom);
  const [activeChangeId] = useAtom(activeChangeIdAtom);
  const changeId = useMemo(
    () => highlightChangeId || activeChangeId,
    [highlightChangeId, activeChangeId]
  );
  const [savedComments] = useAtom(savedCommentsAtom);

  return (
    <div className="step-controls">
      {changeId &&
        savedComments[changeId] &&
        savedComments[changeId].map((comment, i) => (
          <PreviewComment key={i} value={comment.value} />
        ))}

      <WriteComment />
    </div>
  );
}
