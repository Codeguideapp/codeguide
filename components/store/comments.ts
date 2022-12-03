import produce from 'immer';
import create from 'zustand';

import { useChangesStore } from './changes';

interface CommentsState {
  savedComments: Record<string, { value: string }[]>;
  draftComments: Record<string, string>;
  saveActiveNoteVal: (val: string) => void;
  createNewComment: () => void;
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  savedComments: {},
  draftComments: {},

  saveActiveNoteVal: (val: string) => {
    const activeChangeId = useChangesStore.getState().activeChangeId;

    if (!activeChangeId) {
      throw new Error('cant save note, invalid activeChangeId');
    }

    const notes = get().draftComments;
    const newNotes = produce(notes, (notesDraft) => {
      notesDraft[activeChangeId] = val;
    });

    set({ draftComments: newNotes });
  },

  createNewComment: () => {
    const activeChangeId = useChangesStore.getState().activeChangeId;
    const { savedComments, draftComments } = get();

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

    set({ draftComments: newDraftComments, savedComments: newSavedComments });
  },
}));
