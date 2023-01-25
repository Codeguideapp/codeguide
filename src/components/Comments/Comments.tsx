import { useEffect, useRef } from 'react';

import { useChangesStore } from '../store/changes';
import { useCommentsStore } from '../store/comments';
import { useFilesStore } from '../store/files';
import { PreviewComment } from './PreviewComment';

export function Comments() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeFile = useFilesStore((s) => s.activeFile);
  const activeChange = useChangesStore((s) =>
    s.activeChangeId ? s.changes[s.activeChangeId] : null
  );
  const savedComments = useCommentsStore((s) => s.savedComments);

  const commentNum = activeChange
    ? savedComments[activeChange.id]?.length || 0
    : 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commentNum]);

  return (
    <div className="step-controls bg-zinc-900">
      <div className="max-h-[40vh] overflow-auto">
        {activeChange?.id &&
          activeChange.path === activeFile?.path &&
          savedComments[activeChange.id] &&
          savedComments[activeChange.id].map((comment, i) => (
            <PreviewComment key={i} comment={comment} />
          ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
