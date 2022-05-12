import produce, { Draft } from 'immer';
import { atom } from 'jotai';

import { Changes } from './types';

export const changesAtom = atom<Changes>(produce({}, () => {}));
export const changesOrderAtom = atom<string[]>([]);
export const activeChangeIdAtom = atom<string | null>(null);

export const swapChangesAtom = atom(
  null,
  (get, set, { from, to }: { from: string; to: string }) => {
    const changes = get(changesAtom);
    const changesOrder = get(changesOrderAtom);

    if (changes[from].deps.includes(to)) {
      throw new Error(`${from} is dependend on ${to}`);
    }
    if (changes[to].deps.includes(from)) {
      throw new Error(`${to} is dependend on ${from}`);
    }

    const fromIndex = changesOrder.indexOf(from);
    const toIndex = changesOrder.indexOf(to);

    if (Math.abs(fromIndex - toIndex) !== 1) {
      throw new Error(`only adjacent changes can switch places`);
    }
    // moving array item
    const newChangesOrder = [...changesOrder];
    const elCopy = newChangesOrder[fromIndex];
    newChangesOrder.splice(fromIndex, 1); // remove from element
    newChangesOrder.splice(toIndex, 0, elCopy); // add elCopy in toIndex

    set(changesOrderAtom, newChangesOrder);
  }
);

export const updateChangesAtom = atom(
  null,
  (get, set, updateFn: (draft: Draft<Changes>) => void) => {
    const changes = produce(get(changesAtom), updateFn);

    set(changesAtom, changes);
  }
);
