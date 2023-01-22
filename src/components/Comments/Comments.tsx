import { useAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { useResizeDetector } from 'react-resize-detector';

import { stepControlHeightAtom } from '../store/atoms';
import { useChangesStore } from '../store/changes';
import { useCommentsStore } from '../store/comments';
import { PreviewComment } from './PreviewComment';

export function Comments() {
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
      className="step-controls absolute top-[30px] right-0 left-0  bg-zinc-900"
      ref={ref}
    >
      <div className="max-h-[40vh] overflow-auto">
        {activeChangeId &&
          savedComments[activeChangeId] &&
          savedComments[activeChangeId].map((comment, i) => (
            <PreviewComment key={i} comment={comment} />
          ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
