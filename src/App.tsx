import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import Split from 'react-split';
import useSWR from 'swr';

import { setFileChangesAtom } from './atoms/files';
import { guideAtom } from './atoms/guide';
import { Editor } from './Editor/Editor';
import { LeftSide } from './LeftSide/LeftSide';
import { login, logout } from './login';
import { fetchWithThrow } from './utils/fetchWithThrow';

export function App() {
  const [, setFileChanges] = useAtom(setFileChangesAtom);
  const [guide] = useAtom(guideAtom);

  useEffect(() => {
    setFileChanges('');
  }, [setFileChanges]);

  const res = useSWR(
    `https://api.github.com/repos/${guide.owner}/${guide.repository}/git/trees/HEAD?recursive=1`,
    (url) =>
      fetchWithThrow(url, {
        headers: localStorage.getItem('token')
          ? {
              Authorization: 'Bearer ' + localStorage.getItem('token'),
            }
          : {},
      })
  );

  if (res.error && !localStorage.getItem('token')) {
    return (
      <div>
        <div>GitHub fetch repository data failed</div>
        <div>
          Is it a private repo? Try{' '}
          <span style={{ fontWeight: 'bold' }} onClick={login}>
            log in with github
          </span>
        </div>
      </div>
    );
  }
  if (res.error) return <div>GitHub fetch repository data failed</div>;
  if (!res.data) return <div>loading...</div>;

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
