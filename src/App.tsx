import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import Split from 'react-split';

import { setFileChangesAtom } from './atoms/files';
import { guideAtom } from './atoms/guide';
import { Editor } from './Editor/Editor';
import { LeftSide } from './LeftSide/LeftSide';

export function App() {
  const [, setFileChanges] = useAtom(setFileChangesAtom);
  const [guide] = useAtom(guideAtom);

  useEffect(() => {
    setFileChanges('');
  }, [setFileChanges]);

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
        </div>
      </div>
      <div className="main">
        <Split
          className="split-horiz"
          direction="horizontal"
          sizes={[20, 80]}
          minSize={[300, 300]}
          gutterSize={1}
        >
          <LeftSide />
          <Editor />
        </Split>
      </div>
    </div>
  );
}
