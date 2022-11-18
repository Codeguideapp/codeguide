import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { useAtom } from 'jotai';
import { useState } from 'react';
import Split from 'react-split';

import { guideAtom } from './atoms/guide';
import { Editor } from './Editor/Editor';
import { LeftSide } from './LeftSide/LeftSide';
import { logout } from './login';
import { PrevNextControls } from './PrevNextControls/PrevNextControls';

export function App() {
  const [guide] = useAtom(guideAtom);
  const [isDragging, setDragging] = useState(false);

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontWeight: 'bold', fontSize: 12 }}>CodeGuide</span>
          <div className="action">
            <FontAwesomeIcon icon={faGithub} />
            <span>
              {guide.owner}/{guide.repository}#122
            </span>
          </div>
        </div>

        <div className="action">
          <FontAwesomeIcon icon={faCloudArrowUp} />
          <span>Publish</span>
          <span onClick={logout}>logout</span>
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
