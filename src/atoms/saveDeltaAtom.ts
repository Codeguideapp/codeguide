import produce from 'immer';
import { atom } from 'jotai';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { File } from '../api/api';
import { composeDeltas, deltaToString } from '../utils/deltaUtils';
import { getHighlightsAfter, getHighlightsBefore } from '../utils/monaco';
import { changesAtom, changesOrderAtom, updateChangesX } from './changes';
import { setPlayheadXAtom } from './playhead';
import { Change } from './types';
interface SaveDeltaParams {
  delta: Delta;
  file: File;
  isFileDepChange?: boolean;
  eolChar: string;
}

export const saveDeltaAtom = atom(
  null,
  (get, set, { delta, file, isFileDepChange, eolChar }: SaveDeltaParams) => {
    const newChangeId = nanoid();
    const highlightChangeId = nanoid();
    const changes = get(changesAtom);
    const changesOrder = get(changesOrderAtom);

    const fileChanges = changesOrder
      .filter((id) => changes[id].path === file.path && changes[id].delta)
      .map((id) => changes[id].delta!);

    const before = deltaToString(fileChanges);
    const after = deltaToString([...fileChanges, delta]);

    let changeStatus: Change['fileStatus'];
    switch (file.status) {
      case 'added':
        changeStatus = fileChanges.length === 0 ? 'added' : 'modified';
        break;
      case 'deleted':
        changeStatus = after === '' ? 'deleted' : 'modified';
        break;
      default:
        changeStatus = file.status;
    }

    const newChangesOrder = isFileDepChange
      ? [newChangeId, ...changesOrder]
      : [...changesOrder, highlightChangeId, newChangeId];

    const newChanges = produce(changes, (changesDraft) => {
      changesDraft[newChangeId] = {
        isFileDepChange: Boolean(isFileDepChange),
        fileStatus: changeStatus,
        highlight: isFileDepChange ? [] : getHighlightsAfter(delta, eolChar),
        id: newChangeId,
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
        children: !isFileDepChange ? [highlightChangeId] : [],
        deltaInverted: delta.invert(composeDeltas(fileChanges)),
      };

      if (!isFileDepChange) {
        changesDraft[highlightChangeId] = {
          parentChangeId: newChangeId,
          fileStatus: changesDraft[newChangeId].fileStatus,
          path: changesDraft[newChangeId].path,
          isFileDepChange: false,
          children: [],
          highlight: getHighlightsBefore(delta, before, eolChar),
          id: highlightChangeId,
          color: '#cccccc',
          width: 20,
          x: 0,
          actions: {},
        };
      }
    });

    const newChangesOrdered = produce(
      newChanges,
      updateChangesX(newChangesOrder)
    );

    set(changesAtom, newChangesOrdered);
    set(changesOrderAtom, newChangesOrder);
    set(setPlayheadXAtom, Infinity);
  }
);
