import produce, { Draft } from 'immer';
import { atom } from 'jotai';
import { isEqual } from 'lodash';
import type * as monaco from 'monaco-editor';
import type Delta from 'quill-delta';

import { DiffMarker, DiffMarkers } from '../api/diffMarkers';

export type Changes = Record<string, Readonly<Change>>; // changes is updated using immer so the result object can be read only

export type Change = {
  fileStatus: 'added' | 'modified' | 'deleted';
  highlight: {
    offset: number;
    length: number;
    type: 'delete' | 'insert' | 'replace' | 'selection';
    options: monaco.editor.IModelDecorationOptions;
  }[];
  parentChangeId?: string;
  diffMarker?: DiffMarker;
  diffMarkers: DiffMarkers;
  children: string[];
  isFileDepChange: boolean;
  delta?: Delta;
  deltaInverted?: Delta;
  stat?: [number, number];
  id: string;
  x: number;
  path: string;
  width: number;
  actions: Record<
    string,
    {
      label: string;
      color: string;
      callback: () => void;
    }
  >;
};

export const changesAtom = atom<Changes>(produce({}, () => {}));
export const changesOrderAtom = atom<string[]>([]);
export const activeChangeIdAtom = atom<string | null>(null);

export const updateChangesAtom = atom(
  null,
  (get, set, updateFn: (draft: Draft<Changes>) => void) => {
    const changes = produce(get(changesAtom), updateFn);

    set(changesAtom, changes);
  }
);

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

export const updateChangesX =
  (changesOrder: string[]) => (changes: Record<string, Change>) => {
    let x = 20;
    let lastId = '';
    for (const id of changesOrder) {
      if (changes[id].isFileDepChange) {
        continue;
      }

      if (lastId && changes[lastId]?.path !== changes[id].path) {
        x += 30;
      }

      changes[id].x = x;
      const space = changes[id].parentChangeId ? 0 : 5;
      x += changes[id].width + space;

      lastId = id;
    }
  };

export const sortBy = (sortRef: string[]) => (a: string, b: string) =>
  sortRef.indexOf(a) - sortRef.indexOf(b);
