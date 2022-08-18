import produce, { Draft } from 'immer';
import { atom } from 'jotai';
import { isEqual } from 'lodash';
import type * as monaco from 'monaco-editor';
import Delta from 'quill-delta';

import { composeDeltas } from '../utils/deltaUtils';
import { fileChangesAtom } from './files';
import { saveDeltaAtom } from './saveDeltaAtom';

export type Changes = Record<string, Readonly<Change>>; // changes is updated using immer so the result object can be read only

export type Change = {
  fileStatus: 'added' | 'modified' | 'deleted';
  isFileNode?: true;
  isDraft: boolean;
  highlight: {
    offset: number;
    length: number;
    type: 'delete' | 'insert' | 'replace' | 'selection';
    options: monaco.editor.IModelDecorationOptions;
  }[];
  text?: string;
  textType?: 'info' | 'warn' | 'question';
  diffMarkersNum: number;
  isFileDepChange: boolean;
  delta?: Delta;
  deltaInverted?: Delta;
  stat?: [number, number];
  id: string;
  path: string;
};

export const canEditAtom = atom(true);
export const changesAtom = atom<Changes>(produce({}, () => {}));
export const changesOrderAtom = atom<string[]>([]);
export const activeChangeIdAtom = atom<string | null>(null);
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
  set(activeChangeIdAtom, null);

  setTimeout(() => {
    set(saveDeltaAtom, {
      delta: newDelta,
      file,
    });
  }, 0); // todo: fix race condition. see why it doesnt work without timeout
});

export function swapChanges({
  changes,
  changesOrder,
  to,
  from,
  length,
}: {
  to: string;
  from: string;
  length: number;
  changes: Changes;
  changesOrder: string[];
}) {
  if (to === from) {
    throw new Error('"to" and "from" are the same');
  }

  const fromIndex = changesOrder.indexOf(from);
  const toIndex = changesOrder.indexOf(to);

  if (changes[from].path === changes[to].path) {
    throw new Error('can not reorder changes of the same file');
  }
  // moving array item
  const newChangesOrder = [...changesOrder];
  const elCopy = newChangesOrder.splice(fromIndex, length); // remove from element
  newChangesOrder.splice(toIndex, 0, ...elCopy); // add elCopy in toIndex

  const changesFromOrder = changesOrder.filter(
    (id) => changes[from].path === changes[id].path
  );
  const newChangesFromOrder = newChangesOrder.filter(
    (id) => changes[from].path === changes[id].path
  );
  if (!isEqual(changesFromOrder, newChangesFromOrder)) {
    throw new Error('file order can not be changed');
  }

  const changesToOrder = changesOrder.filter(
    (id) => changes[to].path === changes[id].path
  );
  const newChangesToOrder = newChangesOrder.filter(
    (id) => changes[to].path === changes[id].path
  );
  if (!isEqual(changesToOrder, newChangesToOrder)) {
    throw new Error('file order can not be changed');
  }

  return newChangesOrder;
}

export const sortBy = (sortRef: string[]) => (a: string, b: string) =>
  sortRef.indexOf(a) - sortRef.indexOf(b);
