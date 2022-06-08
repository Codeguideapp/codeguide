import produce from 'immer';
import { atom } from 'jotai';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { File } from '../api/api';
import { DiffMarker } from '../api/diffMarkers';
import {
  calcStat,
  composeDeltas,
  countLines,
  deltaToString,
} from '../utils/deltaUtils';
import { getHighlightsAfter, getHighlightsBefore } from '../utils/monaco';
import { changesAtom, changesOrderAtom, updateChangesX } from './changes';
import { setPlayheadXAtom } from './playhead';
import { Change } from './types';
interface SaveDeltaParams {
  delta: Delta;
  file: File;
  isFileDepChange?: boolean;
  eolChar: string;
  diffMarker?: DiffMarker;
}

export const saveDeltaAtom = atom(
  null,
  (
    get,
    set,
    { delta, file, isFileDepChange, eolChar, diffMarker }: SaveDeltaParams
  ) => {
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

    const width = getChangeWidth(delta, before, eolChar);
    const newChanges = produce(changes, (changesDraft) => {
      changesDraft[newChangeId] = {
        isFileDepChange: Boolean(isFileDepChange),
        fileStatus: changeStatus,
        highlight: isFileDepChange ? [] : getHighlightsAfter(delta, eolChar),
        id: newChangeId,
        width: isFileDepChange ? 0 : width,
        x: 0,
        actions: {},
        path: file.path,
        delta,
        diffMarker: !isFileDepChange ? diffMarker : undefined,
        children: !isFileDepChange ? [highlightChangeId] : [],
        deltaInverted: delta.invert(composeDeltas(fileChanges)),
        stat: calcStat(delta),
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
          width: 10,
          x: 0,
          actions: {},
          stat: [0, 0],
        };
      }
    });

    const newChangesOrdered = produce(
      newChanges,
      updateChangesX(newChangesOrder)
    );

    set(changesAtom, newChangesOrdered);
    set(changesOrderAtom, newChangesOrder);
    set(setPlayheadXAtom, { x: Infinity, type: 'ref' });
  }
);

function getChangeWidth(delta: Delta, before: string, eolChar: string): number {
  const stat = calcStat(delta);
  const lines = countLines(delta, before, eolChar);
  const widthFromChars = stat[0] + stat[1];
  const widthFromLines = lines * 50;
  const width =
    widthFromLines > widthFromChars ? widthFromChars : widthFromLines;

  let min = 20;
  let max = 50;

  if (width > 300) {
    max = 60;
  }
  if (width > 800) {
    max = 90;
  }
  if (width > 1000) {
    max = 100;
  }
  if (width > 1500) {
    max = 120;
  }

  return Math.max(min, Math.min(width, max));
}
