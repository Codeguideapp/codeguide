import produce from 'immer';
import { atom } from 'jotai';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { DiffMarker, DiffMarkers, getDiffMarkers } from '../api/diffMarkers';
import {
  calcStat,
  composeDeltas,
  countLines,
  deltaToString,
} from '../utils/deltaUtils';
import { getHighlightsAfter } from '../utils/monaco';
import { changesAtom, changesOrderAtom } from './changes';
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

export const appliedMarkersAtom = atom<DiffMarkers>({});

export const saveDeltaAtom = atom(null, (get, set, params: SaveDeltaParams) => {
  const { delta, file, diffMarker, highlight, isFileDepChange } = params;
  const eolChar = params.eolChar || '\n';
  const newChangeId = nanoid();
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
    : [...changesOrder, newChangeId];

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
      diffMarkersNum: Object.keys(diffMarkers).length,
      deltaInverted: delta.invert(composeDeltas(fileChanges)),
      stat: highlight ? undefined : calcStat(delta),
    };
  });

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

  set(changesAtom, newChanges);
  set(changesOrderAtom, newChangesOrder);
  set(setPlayheadXAtom, { x: Infinity, type: 'ref' });
  set(scrollToAtom, get(playheadXAtom));

  if (diffMarker) {
    set(appliedMarkersAtom, {
      ...get(appliedMarkersAtom),
      [diffMarker.id]: {
        ...diffMarker,
        changeId: newChangeId,
      },
    });
  }
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
