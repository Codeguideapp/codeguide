import produce from 'immer';
import { atom } from 'jotai';

import { activeChangeIdAtom } from './changes';

export const savedCommentsAtom = atom<Record<string, { value: string }[]>>({});
export const draftCommentsAtom = atom<Record<string, string>>({});

export const saveActiveNoteValAtom = atom(null, (get, set, val: string) => {
  const activeChangeId = get(activeChangeIdAtom);

  if (!activeChangeId) {
    throw new Error('cant save note, invalid activeChangeId');
  }

  const notes = get(draftCommentsAtom);
  const newNotes = produce(notes, (notesDraft) => {
    notesDraft[activeChangeId] = val;
  });

  set(draftCommentsAtom, newNotes);
});

export const createNewCommentAtom = atom(null, (get, set) => {
  const activeChangeId = get(activeChangeIdAtom);
  const savedComments = get(savedCommentsAtom);
  const draftComments = get(draftCommentsAtom);

  if (!activeChangeId) {
    throw new Error('cant save note, invalid activeChangeId');
  }
  if (!draftComments[activeChangeId]) {
    throw new Error('comment is empty');
  }

  const newSavedComments = produce(savedComments, (draftObj) => {
    draftObj[activeChangeId] = [
      ...(draftObj[activeChangeId] || []),
      {
        value: draftComments[activeChangeId],
      },
    ];
  });
  const newDraftComments = produce(draftComments, (draftObj) => {
    draftObj[activeChangeId] = '';
  });

  set(draftCommentsAtom, newDraftComments);
  set(savedCommentsAtom, newSavedComments);
});
