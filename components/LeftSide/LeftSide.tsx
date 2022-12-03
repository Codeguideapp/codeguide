/* eslint-disable @next/next/no-img-element */
import classNames from 'classnames';
import { useAtom } from 'jotai';

import { activeSectionAtom } from '../store/atoms';
import { ChangedFiles } from './ChangedFiles';
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
          <img width="22" src="/icons/files.svg" alt="File Explorer" />
        </div>
        <div
          onClick={() => setActiveSection('changedFiles')}
          className={classNames({
            icon: true,
            active: activeSection === 'changedFiles',
          })}
        >
          <img width="24" src="/icons/filediff.svg" alt="File Changes" />
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
