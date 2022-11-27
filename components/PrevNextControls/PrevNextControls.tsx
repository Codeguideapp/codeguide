import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBackwardStep,
  faForwardStep,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { useAtom } from 'jotai';
import { last } from 'lodash';
import * as Mousetrap from 'mousetrap';
import { useCallback, useEffect, useMemo } from 'react';

import { changesAtom, highlightChangeIdAtom } from '../atoms/changes';
import { setActiveFileByPathAtom } from '../atoms/files';

library.add(faBackwardStep, faForwardStep, faPlay);

export function PrevNextControls() {
  const [changes] = useAtom(changesAtom);
  const [highlightChangeId, setHighlightChangeId] = useAtom(
    highlightChangeIdAtom
  );
  const [, setFileByPath] = useAtom(setActiveFileByPathAtom);

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

    setHighlightChangeId(firstChange);
    setFileByPath(changes[firstChange].path);
  }, [changesIdsNoFile, changes, setHighlightChangeId, setFileByPath]);

  const goToPrevChange = useCallback(() => {
    if (!highlightChangeId) {
      const lastChangeId = last(changesIdsNoFile);
      if (lastChangeId) {
        setHighlightChangeId(lastChangeId);
        setFileByPath(changes[lastChangeId].path);
      }
      return;
    }

    const currentIndex = changesIdsNoFile.indexOf(highlightChangeId);

    const prevChangeId = changesIdsNoFile[currentIndex - 1];
    if (!prevChangeId) return;

    setHighlightChangeId(prevChangeId);
    setFileByPath(changes[prevChangeId].path);
  }, [
    highlightChangeId,
    changes,
    changesIdsNoFile,
    setHighlightChangeId,
    setFileByPath,
  ]);

  const goToNextChange = useCallback(() => {
    if (!highlightChangeId) {
      return;
    }

    const currentIndex = changesIdsNoFile.indexOf(highlightChangeId);
    const nextChangeId = changesIdsNoFile[currentIndex + 1];

    setHighlightChangeId(nextChangeId);

    if (nextChangeId) {
      setFileByPath(changes[nextChangeId].path);
    }
  }, [
    highlightChangeId,
    changes,
    changesIdsNoFile,
    setFileByPath,
    setHighlightChangeId,
  ]);

  const goToLastChange = useCallback(() => {
    setHighlightChangeId(null);
    const lastChangeId = last(Object.keys(changes).sort());
    if (lastChangeId) {
      setFileByPath(changes[lastChangeId].path);
    }
  }, [changes, setHighlightChangeId, setFileByPath]);

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
