import { library } from '@fortawesome/fontawesome-svg-core';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import { useAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { useResizeDetector } from 'react-resize-detector';

import { isEditing, stepControlHeightAtom } from '../store/atoms';
import { useChangesStore } from '../store/changes';
import { useCommentsStore } from '../store/comments';
import { PreviewComment } from './PreviewComment';
import { StepActions } from './StepActions';
import { WriteComment } from './WriteComment';

library.add(faComment);

export function BottomBar() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeChangeId = useChangesStore((s) => s.activeChangeId);
  const savedComments = useCommentsStore((s) => s.savedComments);
  const [, setStepControlHeight] = useAtom(stepControlHeightAtom);
  const { ref } = useResizeDetector({
    skipOnMount: true,
    onResize(_, height) {
      if (typeof height === 'number') {
        setStepControlHeight(height);
      }
    },
  });

  const commentNum = activeChangeId
    ? savedComments[activeChangeId]?.length || 0
    : 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commentNum]);

  return (
    <div
      className="bg-zinc-900 absolute bottom-0 right-0 left-0  step-controls"
      ref={ref}
    >
      <div className="overflow-auto max-h-[40vh]">
        {activeChangeId &&
          savedComments[activeChangeId] &&
          savedComments[activeChangeId].map((comment, i) => (
            <PreviewComment key={i} comment={comment} />
          ))}
        <div ref={bottomRef} />
      </div>

      {isEditing() && (
        <div
          style={{
            padding: 10,
            justifyContent: 'right',
            display: 'flex',
            gap: 10,
          }}
        >
          <div style={{ marginRight: 'auto', flexGrow: 1 }}>
            <WriteComment />
          </div>
          <StepActions />
        </div>
      )}
    </div>
  );
}
