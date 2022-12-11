import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { useAtom } from 'jotai';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import Split from 'react-split';

import { Editor } from './Editor/Editor';
import { LeftSide } from './LeftSide/LeftSide';
import { PrevNextControls } from './PrevNextControls';
import { useChangesStore } from './store/changes';
import { useCommentsStore } from './store/comments';
import { useGuideStore } from './store/guide';

export function App() {
  const repository = useGuideStore((s) => s.repository);
  const owner = useGuideStore((s) => s.owner);
  const pushComments = useCommentsStore((s) => s.pushComments);
  const saveChangesToServer = useChangesStore((s) => s.saveChangesToServer);
  const [isDragging, setDragging] = useState(false);

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontWeight: 'bold', fontSize: 12 }}>CodeGuide</span>
          <div className="action">
            <FontAwesomeIcon icon={faGithub} />
            <span>
              {owner}/{repository}#122
            </span>
          </div>
        </div>

        <div className="action">
          <FontAwesomeIcon icon={faCloudArrowUp} />
          <span>Publish</span>
          <span
            onClick={() => {
              saveChangesToServer();
              pushComments();
            }}
          >
            save
          </span>
          <span onClick={() => signOut()}>logout</span>
        </div>
      </div>
      <div className="fixed top-[40px] bottom-0 left-0 right-0">
        <Split
          className={classNames({ 'split-horiz': true, dragging: isDragging })}
          direction="horizontal"
          sizes={[20, 80]}
          minSize={[300, 300]}
          gutterSize={5}
          onDragStart={() => setDragging(true)}
          onDragEnd={() => setDragging(false)}
        >
          <LeftSide />
          <Editor />
        </Split>
      </div>
      <PrevNextControls />
    </div>
  );
}
