import { atom } from 'jotai';
import { last } from 'lodash';

import { activeChangeIdAtom, changesAtom, changesOrderAtom } from './changes';

export const playheadXAtom = atom(10);
export const refPlayheadXAtom = atom(10);
export const canEditAtom = atom(true);
export const playheadSpeedAtom = atom(1);
export const isPlayheadVisibleAtom = atom(false);

let playingInterval: NodeJS.Timeout;
export const isPlayingAtom = atom(false);
export const setIsPlayingAtom = atom(false, (get, set, isPlaying: boolean) => {
  clearInterval(playingInterval);

  if (isPlaying) {
    if (get(canEditAtom)) {
      // if at the end when play is set, start from beginning
      set(setPlayheadXAtom, { x: 0, type: 'ref' });
    }
    set(isPlayheadVisibleAtom, false);
    playingInterval = setInterval(() => {
      if (get(canEditAtom)) {
        // playhead is at the end, stop playing
        clearInterval(playingInterval);
        set(isPlayingAtom, false);
        set(setPlayheadXAtom, { x: Infinity, type: 'ref' });
        return;
      }

      const playheadX = get(playheadXAtom);
      set(setPlayheadXAtom, {
        x: playheadX + get(playheadSpeedAtom),
        type: 'ref',
      });
    }, 30);
  }
  set(isPlayingAtom, isPlaying);
});

export const setPlayheadXAtom = atom(
  null,
  (get, set, { x, type }: { x: number; type: 'ref' | 'preview' }) => {
    const changes = get(changesAtom);
    const changesOrder = get(changesOrderAtom);

    const lastChangeId = last(changesOrder);

    const maxPlayheadX = lastChangeId
      ? changes[lastChangeId].x + changes[lastChangeId].width + 20
      : 10;

    const canEditTreshold = lastChangeId
      ? changes[lastChangeId].x + changes[lastChangeId].width
      : 0;

    const newPlayHeadX = x > maxPlayheadX ? maxPlayheadX : x;
    const canEdit = newPlayHeadX >= canEditTreshold;

    const appliedIds = changesOrder.filter(
      (id) => changes[id].x < newPlayHeadX && !changes[id].isFileDepChange
    );
    const activeChangeId = canEdit ? null : last(appliedIds) || null;

    set(playheadXAtom, newPlayHeadX);

    if (type === 'ref') {
      set(refPlayheadXAtom, newPlayHeadX);
    }
    set(activeChangeIdAtom, activeChangeId);
    set(canEditAtom, canEdit);
  }
);
