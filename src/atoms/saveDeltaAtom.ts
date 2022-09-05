import produce from 'immer';
import { atom } from 'jotai';
import { last } from 'lodash';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { DiffMarker, getDiffMarkers } from '../api/diffMarkers';
import { calcStat, composeDeltas, deltaToString } from '../utils/deltaUtils';
import { changesAtom, changesOrderAtom } from './changes';
import { Change } from './changes';
import { File, fileChangesAtom } from './files';
interface SaveDeltaParams {
  delta: Delta;
  highlight: Change['highlight'];
  file: File;
  isFileDepChange?: boolean;
  eolChar?: string;
  tabChar?: string;
  diffMarker?: DiffMarker;
}

export const appliedMarkersAtom = atom<(DiffMarker & { path: string })[]>([]);

export const undraftChangeAtom = atom(null, (get, set, id: string) => {
  const changes = get(changesAtom);
  const newChanges = produce(changes, (changesDraft) => {
    changesDraft[id].isDraft = false;
  });
  set(changesAtom, newChanges);
});

export const saveFileNodeAtom = atom(null, (get, set, path: string) => {
  const changes = get(changesAtom);
  const changesOrder = get(changesOrderAtom);

  const nonDepChanges = changesOrder
    .filter((id) => !changes[id].isFileDepChange)
    .map((id) => changes[id]);

  const lastChange = last(nonDepChanges);
  const secondLast = nonDepChanges[nonDepChanges.length - 2];

  if (lastChange?.path !== path && lastChange?.isFileNode) {
    if (secondLast?.path === path) {
      const newChangesOrder = changesOrder.slice(0, changesOrder.length - 1);
      const newChanges = produce(changes, (changesDraft) => {
        delete changesDraft[lastChange.id];
      });
      set(changesAtom, newChanges);
      set(changesOrderAtom, newChangesOrder);
    } else {
      const newChanges = produce(changes, (changesDraft) => {
        changesDraft[lastChange.id].path = path;
      });

      set(changesAtom, newChanges);
    }
  } else if (!lastChange || lastChange.path !== path) {
    const newChangeId = nanoid();
    const newChangesOrder = [...changesOrder, newChangeId];

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
        diffMarkersNum: 0,
        deltaInverted: new Delta(),
      };
    });

    set(changesAtom, newChanges);
    set(changesOrderAtom, newChangesOrder);
  }
});

export const saveDeltaAtom = atom(null, (get, set, params: SaveDeltaParams) => {
  const { delta, file, diffMarker, highlight, isFileDepChange } = params;
  const eolChar = params.eolChar || '\n';
  const changes = get(changesAtom);
  const changesOrder = get(changesOrderAtom);

  const fileChanges = changesOrder
    .filter((id) => changes[id].path === file.path && changes[id].delta)
    .map((id) => changes[id].delta!);

  const before = deltaToString(fileChanges);
  const after = deltaToString([...fileChanges, delta]);
  const diffMarkers = getDiffMarkers({
    modifiedValue: after,
    originalValue: file.newVal,
    eol: eolChar,
  });

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

      if (before === after) {
        delete changesDraft[lastChangeId];
      } else {
        changesDraft[lastChangeId].delta = newDelta;
        changesDraft[lastChangeId].deltaInverted = newDelta.invert(
          composeDeltas(fileChanges)
        );
        changesDraft[lastChangeId].stat = calcStat(newDelta);
      }
    });

    if (!newChanges[lastChangeId]) {
      set(changesOrderAtom, changesOrder.slice(0, changesOrder.length - 1));
    }
    set(changesAtom, newChanges);

    if (diffMarker) {
      set(appliedMarkersAtom, [
        ...get(appliedMarkersAtom),
        { ...diffMarker, path: file.path, changeId: lastChangeId },
      ]);
    }
  } else {
    if (before === after && highlight.length === 0) {
      return;
    }

    const newChangeId = nanoid();
    const newChangesOrder = isFileDepChange
      ? [newChangeId, ...changesOrder]
      : [...changesOrder, newChangeId];

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
        diffMarkersNum: Object.keys(diffMarkers).length,
        deltaInverted: delta.invert(composeDeltas(fileChanges)),
        stat: calcStat(delta),
      };
    });

    set(changesAtom, newChanges);
    set(changesOrderAtom, newChangesOrder);

    if (diffMarker) {
      set(appliedMarkersAtom, [
        ...get(appliedMarkersAtom),
        { ...diffMarker, path: file.path, changeId: newChangeId },
      ]);
    }
  }

  const savedFileChanges = get(fileChangesAtom);
  for (const savedFile of savedFileChanges) {
    if (savedFile.path === file.path) {
      file.prevVal = after;
      file.diffMarkers = diffMarkers;
      file.totalDiffMarkers = Math.max(
        Object.keys(diffMarkers).length,
        file.totalDiffMarkers
      );
    }
  }
  set(fileChangesAtom, [...savedFileChanges]);
});
