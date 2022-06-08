import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBackward,
  faBackwardStep,
  faForward,
  faForwardStep,
  faPause,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAtom } from 'jotai';
import React, { useCallback } from 'react';

import {
  isPlayingAtom,
  playheadSpeedAtom,
  setIsPlayingAtom,
  setPlayheadXAtom,
} from '../atoms/playhead';

library.add(
  faPause,
  faPlay,
  faBackward,
  faForward,
  faBackwardStep,
  faForwardStep
);

export function MediaControls() {
  const [, setPlayheadX] = useAtom(setPlayheadXAtom);
  const [isPlaying] = useAtom(isPlayingAtom);
  const [, setIsPlaying] = useAtom(setIsPlayingAtom);
  const [playheadSpeed, setPlayheadSpeed] = useAtom(playheadSpeedAtom);

  const playHandler = useCallback(() => setIsPlaying(true), [setIsPlaying]);
  const pauseHandler = useCallback(() => setIsPlaying(false), [setIsPlaying]);
  const stepBackwardHandler = useCallback(
    () => setPlayheadX({ x: 10, type: 'ref' }),
    [setPlayheadX]
  );
  const stepForwardHandler = useCallback(
    () => setPlayheadX({ x: Infinity, type: 'ref' }),
    [setPlayheadX]
  );
  const setSpeedHandler = useCallback(() => {
    let newSpeed = playheadSpeed * 2;
    if (newSpeed > 32) {
      newSpeed = 1;
    }
    setPlayheadSpeed(newSpeed);
  }, [playheadSpeed, setPlayheadSpeed]);

  return (
    <div className="media-controls">
      <FontAwesomeIcon icon="backward-step" onClick={stepBackwardHandler} />

      {isPlaying ? (
        <FontAwesomeIcon icon="pause" onClick={pauseHandler} />
      ) : (
        <FontAwesomeIcon icon="play" onClick={playHandler} />
      )}
      <FontAwesomeIcon icon="forward-step" onClick={stepForwardHandler} />
      <div className="speed" onClick={setSpeedHandler}>
        {playheadSpeed}x
      </div>
    </div>
  );
}
