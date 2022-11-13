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

import {
  changesAtom,
  changesOrderAtom,
  highlightChangeIdAtom,
} from '../atoms/changes';
import { setActiveFileByPathAtom } from '../atoms/files';

library.add(faBackwardStep, faForwardStep, faPlay);

export function PrevNextControls() {
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [highlightChangeId, setHighlightChangeId] = useAtom(
    highlightChangeIdAtom
  );
  const [, setFileByPath] = useAtom(setActiveFileByPathAtom);

  const changesIdsNoFile = useMemo(
    () =>
      changesOrder.filter(
        (id) => !changes[id].isFileDepChange && !changes[id].isFileNode
      ),
    [changesOrder, changes]
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
    setFileByPath(changes[nextChangeId].path);
  }, [
    highlightChangeId,
    changes,
    changesIdsNoFile,
    setFileByPath,
    setHighlightChangeId,
  ]);

  const goToLastChange = useCallback(() => {
    setHighlightChangeId(null);
    const lastChange = last(changesOrder);
    if (lastChange) {
      setFileByPath(changes[lastChange].path);
    }
  }, [changes, changesOrder, setHighlightChangeId, setFileByPath]);

  useEffect(() => {
    Mousetrap.bindGlobal(['shift+up', 'shift+left'], goToFirstChange);
    Mousetrap.bindGlobal(['up', 'left'], goToPrevChange);
    Mousetrap.bindGlobal(['down', 'right', 'space'], goToNextChange);
    Mousetrap.bindGlobal(['shift+down', 'shift+right'], goToLastChange);

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

  // return (
  //   <div className={styles['prev-next-controls']}>
  //     {highlightChangeIndex === 1 ? (
  //       <FontAwesomeIcon icon="backward-step" className="disabled" />
  //     ) : (
  //       <FontAwesomeIcon icon="backward-step" onClick={goToFirstChange} />
  //     )}
  //     {highlightChangeIndex === 1 ? (
  //       <FontAwesomeIcon icon="play" className="disabled" rotation={180} />
  //     ) : (
  //       <FontAwesomeIcon icon="play" onClick={goToPrevChange} rotation={180} />
  //     )}

  //     {!highlightChangeId ? (
  //       <FontAwesomeIcon icon="play" className="disabled" />
  //     ) : (
  //       <FontAwesomeIcon icon="play" onClick={goToNextChange} />
  //     )}

  //     {!highlightChangeId ? (
  //       <FontAwesomeIcon icon="forward-step" className="disabled" />
  //     ) : (
  //       <FontAwesomeIcon icon="forward-step" onClick={goToLastChange} />
  //     )}
  //   </div>
  // );
}
