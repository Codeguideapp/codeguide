import './Notes.css';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import { useAtom } from 'jotai';
import { useState } from 'react';

import { activeChangeIdAtom } from '../atoms/changes';
import { PreviewNotes } from './PreviewNotes';
import { WriteNotes } from './WriteNotes';

library.add(faComment);

export function Notes() {
  const [activeChangeId] = useAtom(activeChangeIdAtom);
  const [writeOrPreview, setWriteOrPreview] = useState<'write' | 'preview'>(
    'write'
  );

  if (!activeChangeId) {
    return (
      <div className="notes">
        <div className="header">
          <span className="title">Notes</span>
        </div>
        <div className="message">Select or create a new step first...</div>
      </div>
    );
  }

  return (
    <div className="notes">
      <div className="header">
        <span className="title">Notes</span>
        <div className="right">
          <span
            onClick={() => setWriteOrPreview('write')}
            style={{ opacity: writeOrPreview === 'write' ? 1 : 0.5 }}
          >
            Write
          </span>
          <span
            onClick={() => setWriteOrPreview('preview')}
            style={{ opacity: writeOrPreview === 'preview' ? 1 : 0.5 }}
          >
            Preview
          </span>
        </div>
      </div>

      {writeOrPreview === 'write' ? <WriteNotes /> : <PreviewNotes />}
    </div>
  );
}
