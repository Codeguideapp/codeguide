import produce from 'immer';
import { atom } from 'jotai';
import { last } from 'lodash';
import Delta from 'quill-delta';
import { ulid } from 'ulid';

import { calcStat, composeDeltas, deltaToString } from '../utils/deltaUtils';
import { changesAtom } from './changes';
import { Change } from './changes';
import { draftCommentsAtom, savedCommentsAtom } from './comments';
import { FileNode, fileNodesAtom } from './files';
interface SaveDeltaParams {
  delta: Delta;
  highlight: Change['highlight'];
  file: FileNode;
  isFileDepChange?: boolean;
}

export const saveFileNodeAtom = atom(null, (get, set, path: string) => {
  let changes = get(changesAtom);
  const file = get(fileNodesAtom).find((f) => f.path === path);

  if (!file) {
    throw new Error('file not found');
  }

  if (
    file.status !== 'added' &&
    !Object.values(changes).find((change) => change.path === file.path)
  ) {
    // this is first time change is saved for a file
    set(saveDeltaAtom, {
      file,
      isFileDepChange: true,
      delta: new Delta().insert(file.oldVal),
      highlight: [],
    });

    changes = get(changesAtom);
  }

  const nonDepChanges = Object.keys(changes)
    .sort()
    .filter((id) => !changes[id].isFileDepChange)
    .map((id) => changes[id]);

  const lastChange = last(nonDepChanges);
  const secondLast = nonDepChanges[nonDepChanges.length - 2];

  if (lastChange?.path !== path && lastChange?.isFileNode) {
    if (secondLast?.path === path) {
      const newChanges = produce(changes, (changesDraft) => {
        delete changesDraft[lastChange.id];
      });
      set(changesAtom, newChanges);
    } else {
      const newChanges = produce(changes, (changesDraft) => {
        changesDraft[lastChange.id].path = path;
      });

      set(changesAtom, newChanges);
    }
  } else if (!lastChange || lastChange.path !== path) {
    const newChangeId = ulid();

    const newChanges = produce(changes, (changesDraft) => {
      changesDraft[newChangeId] = {
        isFileNode: true,
        isDraft: false,
        fileStatus: 'modified', // todo
        highlight: [],
        id: newChangeId,
        path,
        delta: new Delta(),
        stat: [0, 0],
        deltaInverted: new Delta(),
      };
    });

    set(changesAtom, newChanges);
  }
});

export const saveDeltaAtom = atom(null, (get, set, params: SaveDeltaParams) => {
  const { delta, file, highlight, isFileDepChange } = params;
  const changes = get(changesAtom);
  const changesOrder = Object.keys(changes).sort();

  const fileChanges = changesOrder
    .filter((id) => changes[id].path === file.path && changes[id].delta)
    .map((id) => changes[id].delta!);

  const before = deltaToString(fileChanges);
  const after = deltaToString([...fileChanges, delta]);

  let changeStatus: Change['fileStatus'] = 'modified';
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

  const lastChangeId = last(changesOrder);

  if (
    lastChangeId &&
    changes[lastChangeId].isDraft &&
    changes[lastChangeId].path === file.path
  ) {
    const newChanges = produce(changes, (changesDraft) => {
      const newDelta = changesDraft[lastChangeId].delta!.compose(delta);

      const fileChanges = changesOrder
        .slice(0, changesOrder.length - 1)
        .filter((id) => changes[id].path === file.path && changes[id].delta)
        .map((id) => changes[id].delta!);

      const before = deltaToString(fileChanges);
      const after = deltaToString([...fileChanges, newDelta]);

      const draftComments = get(draftCommentsAtom);
      const savedComments = get(savedCommentsAtom);
      if (
        before === after &&
        highlight.length === 0 &&
        !draftComments[lastChangeId] &&
        !savedComments[lastChangeId]
      ) {
        delete changesDraft[lastChangeId];
      } else {
        changesDraft[lastChangeId].delta = newDelta;
        changesDraft[lastChangeId].deltaInverted = newDelta.invert(
          composeDeltas(fileChanges)
        );
        changesDraft[lastChangeId].stat = calcStat(newDelta);
        changesDraft[lastChangeId].highlight = highlight;
      }
    });

    set(changesAtom, newChanges);
  } else {
    if (before === after && highlight.length === 0) {
      return;
    }

    const newChangeId = ulid();

    const newChanges = produce(changes, (changesDraft) => {
      if (!isFileDepChange) {
        for (const id of changesOrder) {
          if (changesDraft[id].isDraft) {
            changesDraft[id].isDraft = false;
          }
        }
      }

      changesDraft[newChangeId] = {
        isDraft: !isFileDepChange,
        isFileDepChange: isFileDepChange || undefined,
        fileStatus: changeStatus,
        highlight: highlight,
        id: newChangeId,
        path: file.path,
        delta,
        deltaInverted: delta.invert(composeDeltas(fileChanges)),
        stat: calcStat(delta),
      };
    });

    set(changesAtom, newChanges);
  }
});
