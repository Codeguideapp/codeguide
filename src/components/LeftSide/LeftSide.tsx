/* eslint-disable @next/next/no-img-element */
import classNames from 'classnames';
import { useAtom } from 'jotai';

import { Guide } from '../../types/Guide';
import { activeSectionAtom, isEditing } from '../store/atoms';
import { ChangedFiles } from './ChangedFiles';
import { FilesExplorer } from './FilesExplorer';
import { GuideFiles } from './GuideFiles';

export function LeftSide({ guide }: { guide: Guide }) {
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
          <img width="20" src="/icons/git.svg" alt="Changed Files" />
        </div>
        {isEditing() && (
          <div
            onClick={() => setActiveSection('guideFiles')}
            className={classNames({
              icon: true,
              active: activeSection === 'guideFiles',
            })}
          >
            <img width="22" src="/icons/library.svg" alt="Changed Files" />
          </div>
        )}
      </div>
      {activeSection === 'changedFiles' ? (
        <ChangedFiles guide={guide} />
      ) : activeSection === 'filesExplorer' ? (
        <FilesExplorer />
      ) : activeSection === 'guideFiles' ? (
        <GuideFiles />
      ) : null}
    </div>
  );
}
