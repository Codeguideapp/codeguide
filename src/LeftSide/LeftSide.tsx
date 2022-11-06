import classNames from 'classnames';
import { useAtom } from 'jotai';

import { activeSectionAtom } from '../atoms/layout';
import { ChangedFiles } from './ChangedFiles';
import { ReactComponent as FilesDiffIcon } from './filediff.svg';
import { ReactComponent as FilesIcon } from './files.svg';
import { FilesExplorer } from './FilesExplorer';

export function LeftSide() {
  const [activeSection, setActiveSection] = useAtom(activeSectionAtom);

  return (
    <div className="main-left">
      <div className="left-menu">
        <div
          onClick={() => setActiveSection('filesExplorer')}
          className={classNames({
            icon: true,
            active: activeSection === 'filesExplorer',
          })}
        >
          <FilesIcon width={28} />
        </div>
        <div
          onClick={() => setActiveSection('changedFiles')}
          className={classNames({
            icon: true,
            active: activeSection === 'changedFiles',
          })}
        >
          <FilesDiffIcon width={28} />
        </div>
      </div>
      {activeSection === 'changedFiles' ? (
        <ChangedFiles />
      ) : activeSection === 'filesExplorer' ? (
        <FilesExplorer />
      ) : null}
    </div>
  );
}
