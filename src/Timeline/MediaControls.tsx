import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowLeft,
  faArrowRight,
  faBackward,
  faBackwardStep,
  faForward,
  faForwardStep,
  faPause,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAtom, useAtomValue } from 'jotai';
import Mousetrap from 'mousetrap';
import React, { useCallback, useEffect } from 'react';

import { changesAtom, changesOrderAtom } from '../atoms/changes';
import {
  canEditAtom,
  playheadXAtom,
  setPlayheadXAtom,
} from '../atoms/playhead';

library.add(
  faPause,
  faArrowRight,
  faArrowLeft,
  faBackward,
  faForward,
  faBackwardStep,
  faForwardStep
);

export function MediaControls() {
  const changes = useAtomValue(changesAtom);
  const [, setPlayheadX] = useAtom(setPlayheadXAtom);
  const playHeadX = useAtomValue(playheadXAtom);
  const canEdit = useAtomValue(canEditAtom);
  const changesOrder = useAtomValue(changesOrderAtom);
  const firstChange = changesOrder
    .map((id) => changes[id])
    .filter((c) => !c.isFileDepChange)[0];

  const nextHandler = useCallback(() => {
    const sortedChanges = Object.values(changes).sort((a, b) => a.x - b.x);
    const nexChange = sortedChanges.find(
      (c) => c.isFileDepChange === false && c.x >= playHeadX
    );

    if (!nexChange) {
      return setPlayheadX({
        x: Infinity,
        type: 'ref',
      });
    }

    let newX = nexChange.x + nexChange.width;

    const noDepsChanges = sortedChanges.filter((c) => !c.isFileDepChange);
    const lastId = noDepsChanges?.[noDepsChanges.length - 1]?.id;

    if (nexChange?.id === lastId && noDepsChanges[1]) {
      newX -= 1;
    }

    setPlayheadX({
      x: newX,
      type: 'ref',
    });
  }, [setPlayheadX, changes, playHeadX]);

  const prevHandler = useCallback(() => {
    const sortedChanges = Object.values(changes).sort((a, b) => b.x - a.x);
    let nexChange = sortedChanges.find(
      (c) => c.isFileDepChange === false && playHeadX > c.x + c.width
    );

    if (!nexChange) return;

    let newX = nexChange.x + nexChange.width;

    const noDepsChanges = sortedChanges.filter((c) => !c.isFileDepChange);
    if (nexChange?.id === noDepsChanges?.[0]?.id && noDepsChanges[1]) {
      newX -= 1;
    }

    setPlayheadX({
      x: newX,
      type: 'ref',
    });
  }, [setPlayheadX, changes, playHeadX]);

  useEffect(() => {
    Mousetrap.bind('left', prevHandler);
  }, [prevHandler]);

  useEffect(() => {
    Mousetrap.bind('right', nextHandler);
  }, [nextHandler]);

  const stepBackwardHandler = useCallback(
    () => setPlayheadX({ x: 10, type: 'ref' }),
    [setPlayheadX]
  );
  const stepForwardHandler = useCallback(
    () => setPlayheadX({ x: Infinity, type: 'ref' }),
    [setPlayheadX]
  );

  return (
    <div className="media-controls">
      <FontAwesomeIcon icon="backward-step" onClick={stepBackwardHandler} />
      <FontAwesomeIcon
        icon="arrow-left"
        onClick={prevHandler}
        className={
          playHeadX <= firstChange?.x + firstChange?.width ? 'disable' : ''
        }
      />
      <FontAwesomeIcon
        icon="arrow-right"
        onClick={nextHandler}
        className={canEdit ? 'disable' : ''}
      />
      <FontAwesomeIcon icon="forward-step" onClick={stepForwardHandler} />
    </div>
  );
}
