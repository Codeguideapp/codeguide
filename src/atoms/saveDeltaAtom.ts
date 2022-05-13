import produce from 'immer';
import { atom } from 'jotai';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { File } from '../api/api';
import { composeDeltas, deltaToString } from '../utils/deltaUtils';
import { changesAtom, changesOrderAtom } from './changes';
import { setPlayheadXAtom } from './playhead';
import { Change } from './types';
interface SaveDeltaParams {
  delta: Delta;
  file: File;
  isFileDepChange?: boolean;
}

export const saveDeltaAtom = atom(
  null,
  (get, set, { delta, file, isFileDepChange }: SaveDeltaParams) => {
    const newDraftId = nanoid();
    const changes = get(changesAtom);
    const changesOrder = get(changesOrderAtom);

    const fileChanges = changesOrder
      .filter((id) => changes[id].path === file.path)
      .map((id) => changes[id].delta);

    let changeStatus: Change['status'];
    switch (file.status) {
      case 'added':
        changeStatus = fileChanges.length === 0 ? 'added' : 'modified';
        break;
      case 'deleted':
        const resContent = deltaToString([...fileChanges, delta]);
        changeStatus = resContent === '' ? 'deleted' : 'modified';
        break;
      default:
        changeStatus = file.status;
    }

    const newChangesOrder = isFileDepChange
      ? [newDraftId, ...changesOrder]
      : [...changesOrder, newDraftId];

    const newChanges = produce(changes, (changesDraft) => {
      changesDraft[newDraftId] = {
        isFileDepChange: Boolean(isFileDepChange),
        status: changeStatus,
        id: newDraftId,
        color: changeStatus === 'modified' ? '#374957' : '#0074bb',
        width: isFileDepChange ? 0 : 50,
        x: 0,
        actions: {
          discardDraft: {
            label: 'Discard Draft',
            color: 'red',
            callback: () => {},
          },
          saveChanges: {
            label: 'Save Changes',
            color: 'green',
            callback: () => {},
          },
        },
        path: file.path,
        delta,
        deltaInverted: delta.invert(composeDeltas(fileChanges)),
      };

      let x = 10;
      for (const id of newChangesOrder) {
        if (changesDraft[id].isFileDepChange) {
          continue;
        }
        changesDraft[id].x = x;
        x += changesDraft[id].width + 10;
      }
    });

    set(changesAtom, newChanges);
    set(changesOrderAtom, newChangesOrder);
    set(setPlayheadXAtom, Infinity);
  }
);
