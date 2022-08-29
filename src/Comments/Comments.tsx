import './Comments.css';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faComment } from '@fortawesome/free-solid-svg-icons';

library.add(faComment);

export function Comments() {
  return (
    <div className="comments">
      <div className="header">
        <span className="title">Comments</span>
      </div>
      <div className="body" style={{ opacity: 0.5, fontSize: 12 }}>
        No comments for this step...
      </div>
    </div>
  );
}
