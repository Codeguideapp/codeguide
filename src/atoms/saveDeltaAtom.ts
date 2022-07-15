import produce from 'immer';
import { atom } from 'jotai';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { DiffMarker, getDiffMarkers } from '../api/diffMarkers';
import {
  calcStat,
  composeDeltas,
  countLines,
  deltaToString,
} from '../utils/deltaUtils';
import { getHighlightsAfter, getHighlightsBefore } from '../utils/monaco';
import { changesAtom, changesOrderAtom, updateChangesX } from './changes';
import { Change } from './changes';
import { File, fileChangesAtom } from './files';
import { playheadXAtom, scrollToAtom, setPlayheadXAtom } from './playhead';
interface SaveDeltaParams {
  delta: Delta;
  highlight?: Change['highlight'];
  file: File;
  isFileDepChange?: boolean;
  eolChar?: string;
  tabChar?: string;
  diffMarker?: DiffMarker;
}

export const saveDeltaAtom = atom(null, (get, set, params: SaveDeltaParams) => {
  const { delta, file, diffMarker, highlight, isFileDepChange } = params;
  const eolChar = params.eolChar || '\n';
  const newChangeId = nanoid();
  const highlightChangeId = nanoid();
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

  const newChangesOrder = isFileDepChange
    ? [newChangeId, ...changesOrder]
    : highlight
    ? [...changesOrder, newChangeId]
    : [...changesOrder, highlightChangeId, newChangeId];

  const width = highlight ? 50 : getChangeWidth(delta, before, eolChar);
  const newChanges = produce(changes, (changesDraft) => {
    changesDraft[newChangeId] = {
      isFileDepChange: Boolean(isFileDepChange),
      fileStatus: changeStatus,
      highlight: highlight
        ? highlight
        : isFileDepChange
        ? []
        : getHighlightsAfter(delta, eolChar),
      id: newChangeId,
      width: isFileDepChange ? 0 : width,
      x: 0,
      actions: {},
      path: file.path,
      delta,
      diffMarker: !isFileDepChange ? diffMarker : undefined,
      diffMarkers,
      children: highlight || isFileDepChange ? [] : [highlightChangeId],
      deltaInverted: delta.invert(composeDeltas(fileChanges)),
      stat: highlight ? undefined : calcStat(delta),
    };

    if (!isFileDepChange && !highlight) {
      changesDraft[highlightChangeId] = {
        parentChangeId: newChangeId,
        fileStatus: changesDraft[newChangeId].fileStatus,
        path: changesDraft[newChangeId].path,
        isFileDepChange: false,
        children: [],
        highlight: getHighlightsBefore(delta, before, eolChar),
        diffMarkers,
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

  set(changesAtom, newChangesOrdered);
  set(changesOrderAtom, newChangesOrder);
  set(setPlayheadXAtom, { x: Infinity, type: 'ref' });
  set(scrollToAtom, get(playheadXAtom));
});

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
