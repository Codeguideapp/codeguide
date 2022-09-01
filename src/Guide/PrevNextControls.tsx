import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBackwardStep,
  faForwardStep,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAtom } from 'jotai';
import { last } from 'lodash';
import * as Mousetrap from 'mousetrap';
import { useCallback, useEffect, useMemo } from 'react';

import {
  changesAtom,
  changesOrderAtom,
  highlightChangeIdAtom,
  highlightChangeIndexAtom,
} from '../atoms/changes';

library.add(faBackwardStep, faForwardStep, faPlay);

export function PrevNextControls() {
  const [highlightChangeIndex] = useAtom(highlightChangeIndexAtom);
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [highlightChangeId, setHighlightChangeId] = useAtom(
    highlightChangeIdAtom
  );

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
  }, [changesIdsNoFile, setHighlightChangeId]);

  const goToPrevChange = useCallback(() => {
    if (!highlightChangeId) {
      const lastChangeId = last(changesIdsNoFile);
      if (lastChangeId) {
        setHighlightChangeId(lastChangeId);
      }
      return;
    }

    const currentIndex = changesIdsNoFile.indexOf(highlightChangeId);

    const prevChangeId = changesIdsNoFile[currentIndex - 1];
    if (!prevChangeId) return;

    setHighlightChangeId(prevChangeId);
  }, [highlightChangeId, changesIdsNoFile, setHighlightChangeId]);

  const goToNextChange = useCallback(() => {
    if (!highlightChangeId) {
      return;
    }

    const currentIndex = changesIdsNoFile.indexOf(highlightChangeId);

    const nextChangeId = changesIdsNoFile[currentIndex + 1];
    setHighlightChangeId(nextChangeId);
  }, [highlightChangeId, changesIdsNoFile, setHighlightChangeId]);

  const goToLastChange = useCallback(
    () => setHighlightChangeId(null),
    [setHighlightChangeId]
  );

  useEffect(() => {
    Mousetrap.bindGlobal(['shift+left'], goToFirstChange);
    Mousetrap.bindGlobal(['left'], goToPrevChange);
    Mousetrap.bindGlobal(['right'], goToNextChange);
    Mousetrap.bindGlobal(['shift+right'], goToLastChange);

    return () => {
      Mousetrap.unbind('shift+left');
      Mousetrap.unbind('left');
      Mousetrap.unbind('right');
      Mousetrap.unbind('shift+right');
    };
  }, [goToFirstChange, goToPrevChange, goToNextChange, goToLastChange]);

  return (
    <div className="prev-next-controls">
      {highlightChangeIndex === 1 ? (
        <FontAwesomeIcon icon="backward-step" className="disabled" />
      ) : (
        <FontAwesomeIcon icon="backward-step" onClick={goToFirstChange} />
      )}
      {highlightChangeIndex === 1 ? (
        <FontAwesomeIcon icon="play" className="disabled" rotation={180} />
      ) : (
        <FontAwesomeIcon icon="play" onClick={goToPrevChange} rotation={180} />
      )}

      {!highlightChangeId ? (
        <FontAwesomeIcon icon="play" className="disabled" />
      ) : (
        <FontAwesomeIcon icon="play" onClick={goToNextChange} />
      )}

      {!highlightChangeId ? (
        <FontAwesomeIcon icon="forward-step" className="disabled" />
      ) : (
        <FontAwesomeIcon icon="forward-step" onClick={goToLastChange} />
      )}
    </div>
  );
}
