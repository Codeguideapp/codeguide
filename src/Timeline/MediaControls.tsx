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
import React, { useCallback } from 'react';

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

    if (!nexChange) return;

    setPlayheadX({
      x: nexChange.x + nexChange.width,
      type: 'ref',
    });
  }, [setPlayheadX, changes, playHeadX]);

  const prevHandler = useCallback(() => {
    const sortedChanges = Object.values(changes).sort((a, b) => b.x - a.x);
    const nexChange = sortedChanges.find(
      (c) => c.isFileDepChange === false && playHeadX > c.x + c.width
    );

    if (!nexChange) return;

    setPlayheadX({
      x: nexChange.x + nexChange.width,
      type: 'ref',
    });
  }, [setPlayheadX, changes, playHeadX]);

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
