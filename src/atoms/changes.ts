import produce, { Draft } from 'immer';
import { atom } from 'jotai';
import { isEqual } from 'lodash';

import { Changes } from './types';

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
  from,
  to,
}: {
  to: string;
  from: string;
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
  const elCopy = newChangesOrder[fromIndex];
  newChangesOrder.splice(fromIndex, 1); // remove from element
  newChangesOrder.splice(toIndex, 0, elCopy); // add elCopy in toIndex

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
