import produce, { Draft } from 'immer';
import { atom } from 'jotai';
import type * as monaco from 'monaco-editor';
import Delta from 'quill-delta';

import { composeDeltas } from '../utils/deltaUtils';
import { fileChangesAtom } from './files';
import { saveDeltaAtom } from './saveDeltaAtom';

export type Changes = Record<string, Readonly<Change>>; // changes is updated using immer so the result object can be read only

export type Change = {
  id: string;
  path: string;
  isFileDepChange?: true;
  isFileNode?: true;
  fileStatus: 'added' | 'modified' | 'deleted';
  isDraft: boolean;
  highlight: {
    offset: number;
    length: number;
    type: 'delete' | 'insert' | 'replace' | 'selection';
    options: monaco.editor.IModelDecorationOptions;
  }[];
  diffMarkersNum: number;
  delta: Delta;
  deltaInverted?: Delta;
  stat: [number, number];
};

export const changesAtom = atom<Changes>(produce({}, () => {}));
export const changesOrderAtom = atom<string[]>([]);
export const highlightChangeIdAtom = atom<string | null>(null);
export const selectedChangeIdsAtom = atom<string[]>([]);

export const updateChangesAtom = atom(
  null,
  (get, set, updateFn: (draft: Draft<Changes>) => void) => {
    const changes = produce(get(changesAtom), updateFn);

    set(changesAtom, changes);
  }
);

export const mergeChangesAtom = atom(null, (get, set, mergeNum: number) => {
  const changes = get(changesAtom);
  const changesOrder = get(changesOrderAtom);
  const toMergeIds = changesOrder.slice(-mergeNum);
  const toMergeChanges = toMergeIds.map((id) => changes[id]);

  const allEqual = (arr: string[]) => arr.every((val) => val === arr[0]);
  if (
    !allEqual(toMergeChanges.map((c) => c.fileStatus)) ||
    !allEqual(toMergeChanges.map((c) => c.path))
  ) {
    throw new Error('could not group changes');
  }

  const fileChanges = get(fileChangesAtom);
  const file = fileChanges.find((f) => f.path === toMergeChanges[0].path);

  if (!file) {
    throw new Error('could not group changes. File not found');
  }

  const deltas = toMergeChanges
    //.filter((c) => c.children.length)
    .map((c) => c.delta!);

  const newDelta = composeDeltas(deltas);

  const newChanges = produce(changes, (changesDraft) => {
    for (const id of toMergeIds) {
      delete changesDraft[id];
    }
  });

  set(changesOrderAtom, changesOrder.slice(0, changesOrder.length - mergeNum));
  set(changesAtom, newChanges);

  setTimeout(() => {
    set(saveDeltaAtom, {
      delta: newDelta,
      file,
    });
  }, 0); // todo: fix race condition. see why it doesnt work without timeout
});

export const sortBy = (sortRef: string[]) => (a: string, b: string) =>
  sortRef.indexOf(a) - sortRef.indexOf(b);
