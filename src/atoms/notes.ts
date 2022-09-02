import produce from 'immer';
import { atom } from 'jotai';

import { activeChangeIdAtom } from './changes';

export const notesAtom = atom<Record<string, string>>({});

export const saveActiveNoteValAtom = atom(null, (get, set, val: string) => {
  const activeChangeId = get(activeChangeIdAtom);

  if (!activeChangeId) {
    throw new Error('cant save note, invalid activeChangeId');
  }

  const notes = get(notesAtom);
  const newNotes = produce(notes, (notesDraft) => {
    notesDraft[activeChangeId] = val;
  });

  set(notesAtom, newNotes);
});
