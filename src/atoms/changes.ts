import produce from 'immer';
import { atom } from 'jotai';
import { last } from 'lodash';
import Delta from 'quill-delta';

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
  }[];
  delta: Delta;
  deltaInverted?: Delta;
  stat: [number, number];
};

export const changesAtom = atom<Changes>(produce({}, () => {}));
export const changesOrderAtom = atom<string[]>([]);
export const highlightChangeIdAtom = atom<string | null>(null);

// same as highlightChangeIdAtom but if nothing is highlighted,
// then lastChange is the active one (draft)
export const activeChangeIdAtom = atom((get) => {
  const highlightChangeId = get(highlightChangeIdAtom);

  if (highlightChangeId) {
    return highlightChangeId;
  }

  const changes = get(changesAtom);
  const changesOrder = get(changesOrderAtom);
  const ids = changesOrder.filter(
    (id) => !changes[id].isFileDepChange && !changes[id].isFileNode
  );

  const lastChangeId = last(ids);
  const lastChange = lastChangeId ? changes[lastChangeId] : null;

  if (lastChange?.isDraft) {
    return lastChange.id;
  }

  return null;
});

export const highlightChangeIndexAtom = atom((get) => {
  const changes = get(changesAtom);
  const changesOrder = get(changesOrderAtom);
  const highlightChangeId = get(highlightChangeIdAtom);

  const ids = changesOrder.filter(
    (id) => !changes[id].isFileDepChange && !changes[id].isFileNode
  );

  const lastChangeId = last(ids);
  const lastChange = lastChangeId ? changes[lastChangeId] : null;

  return highlightChangeId
    ? ids.indexOf(highlightChangeId) + 1
    : lastChange?.isDraft
    ? ids.length
    : ids.length + 1;
});

export const undraftChangeAtom = atom(null, (get, set, id: string) => {
  const changes = get(changesAtom);
  const newChanges = produce(changes, (changesDraft) => {
    changesDraft[id].isDraft = false;
  });
  set(changesAtom, newChanges);
});

export const deleteChangeAtom = atom(null, (get, set, id: string) => {
  const changes = get(changesAtom);
  const changesOrder = get(changesOrderAtom);

  if (last(changesOrder) !== id) {
    throw new Error('only last step can be deleted');
  }

  const newChanges = produce(changes, (changesDraft) => {
    delete changesDraft[id];
  });

  set(changesAtom, newChanges);
  set(changesOrderAtom, changesOrder.slice(0, changesOrder.length - 1));

  if (get(highlightChangeIdAtom) === id) {
    set(highlightChangeIdAtom, null);
  }
});
