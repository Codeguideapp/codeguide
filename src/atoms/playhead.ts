import { atom } from 'jotai';
import { last } from 'lodash';

import { activeChangeIdAtom, changesAtom, changesOrderAtom } from './changes';
import { activeFileAtom } from './files';

export const playheadXAtom = atom(10);
export const refPlayheadXAtom = atom(10);
export const canEditAtom = atom(true);
export const playheadSpeedAtom = atom(1);
export const isPlayheadVisibleAtom = atom(false);
export const scrollToAtom = atom(0);

export const setPlayheadXAtom = atom(
  null,
  (get, set, { x, type }: { x: number; type: 'ref' | 'preview' }) => {
    const changes = get(changesAtom);
    const changesOrder = get(changesOrderAtom);
    const activeFile = get(activeFileAtom);

    const lastChangeId = last(changesOrder);
    const lastChange = lastChangeId ? changes[lastChangeId] : undefined;
    let maxPlayheadX = lastChange ? lastChange.x + lastChange.width + 60 : 60;

    if (lastChange?.path !== activeFile?.path) {
      maxPlayheadX += 25;
    }

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
