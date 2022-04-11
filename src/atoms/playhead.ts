import { atom } from 'jotai';
import { last } from 'lodash';

import { activeChangeIdAtom, changesAtom, changesOrderAtom } from './changes';

export const playheadXAtom = atom(0);
export const canEditAtom = atom(false);

export const setPlayheadXAtom = atom(null, (get, set, x: number) => {
  const changes = get(changesAtom);
  const changesOrder = get(changesOrderAtom);

  const lastChangeId = last(changesOrder);

  const maxPlayheadX = lastChangeId
    ? changes[lastChangeId].x + changes[lastChangeId].width
    : 10;

  const canEditTreshold = lastChangeId
    ? changes[lastChangeId].x + changes[lastChangeId].width
    : 0;

  const newPlayHeadX = x === Infinity ? maxPlayheadX : x;
  const canEdit = newPlayHeadX >= canEditTreshold;

  const appliedIds = changesOrder.filter((id) => changes[id].x < newPlayHeadX);
  const activeChangeId = last(appliedIds) || null;

  set(playheadXAtom, newPlayHeadX);
  set(activeChangeIdAtom, activeChangeId);
  set(canEditAtom, canEdit);
});
