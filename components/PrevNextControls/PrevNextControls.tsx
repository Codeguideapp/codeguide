import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBackwardStep,
  faForwardStep,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { last } from 'lodash';
import * as Mousetrap from 'mousetrap';
import { useCallback, useEffect, useMemo } from 'react';

import { useChangesStore } from '../store/changes';
import { useFilesStore } from '../store/files';

library.add(faBackwardStep, faForwardStep, faPlay);

export function PrevNextControls() {
  const changes = useChangesStore((s) => s.changes);
  const activeChangeId = useChangesStore((s) => s.activeChangeId);
  const setActiveChangeId = useChangesStore((s) => s.setActiveChangeId);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);

  const changesIdsNoFile = useMemo(
    () =>
      Object.keys(changes)
        .sort()
        .filter(
          (id) => !changes[id].isFileDepChange && !changes[id].isFileNode
        ),
    [changes]
  );

  const goToFirstChange = useCallback(() => {
    const firstChange = changesIdsNoFile[0];

    if (!firstChange) return;

    setActiveChangeId(firstChange);
    setActiveFileByPath(changes[firstChange].path);
  }, [changesIdsNoFile, changes, setActiveChangeId, setActiveFileByPath]);

  const goToPrevChange = useCallback(() => {
    if (!activeChangeId) {
      const lastChangeId = last(changesIdsNoFile);
      if (lastChangeId) {
        setActiveChangeId(lastChangeId);
        setActiveFileByPath(changes[lastChangeId].path);
      }
      return;
    }

    const currentIndex = changesIdsNoFile.indexOf(activeChangeId);

    const prevChangeId = changesIdsNoFile[currentIndex - 1];
    if (!prevChangeId) return;

    setActiveChangeId(prevChangeId);
    setActiveFileByPath(changes[prevChangeId].path);
  }, [
    activeChangeId,
    changes,
    changesIdsNoFile,
    setActiveChangeId,
    setActiveFileByPath,
  ]);

  const goToNextChange = useCallback(() => {
    if (!activeChangeId) {
      return;
    }

    const currentIndex = changesIdsNoFile.indexOf(activeChangeId);
    const nextChangeId = changesIdsNoFile[currentIndex + 1];

    setActiveChangeId(nextChangeId);

    if (nextChangeId) {
      setActiveFileByPath(changes[nextChangeId].path);
    }
  }, [
    activeChangeId,
    changes,
    changesIdsNoFile,
    setActiveFileByPath,
    setActiveChangeId,
  ]);

  const goToLastChange = useCallback(() => {
    setActiveChangeId(null);
    const lastChangeId = last(Object.keys(changes).sort());
    if (lastChangeId) {
      setActiveFileByPath(changes[lastChangeId].path);
    }
  }, [changes, setActiveChangeId, setActiveFileByPath]);

  useEffect(() => {
    Mousetrap.bind(['shift+up', 'shift+left'], goToFirstChange);
    Mousetrap.bind(['up', 'left'], goToPrevChange);
    Mousetrap.bind(['down', 'right', 'space'], goToNextChange);
    Mousetrap.bind(['shift+down', 'shift+right'], goToLastChange);

    return () => {
      Mousetrap.unbind('shift+up');
      Mousetrap.unbind('shift+left');
      Mousetrap.unbind('up');
      Mousetrap.unbind('left');
      Mousetrap.unbind('down');
      Mousetrap.unbind('right');
      Mousetrap.unbind('space');
      Mousetrap.unbind('shift+down');
      Mousetrap.unbind('shift+right');
    };
  }, [goToFirstChange, goToPrevChange, goToNextChange, goToLastChange]);

  return null;
}
