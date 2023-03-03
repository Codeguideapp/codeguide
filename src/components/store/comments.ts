import produce from 'immer';
import create from 'zustand';

import { fetchWithThrow } from '../../utils/fetchWithThrow';
import { generateId } from '../../utils/generateId';
import { useGuideStore } from './guide';
import { useStepsStore } from './steps';
import { useUserStore } from './user';

export type IComment = {
  isMine: boolean;
  githubUserId: string;
  commentId: string;
  stepId: string;
  commentBody: string;
  timestamp: number;
};
interface CommentsState {
  publishedCommentIds: string[];
  savedComments: Record<string, IComment[]>;
  draftCommentPerStep: Record<string, IComment & { isEditing: boolean }>;
  hasDataToPublish: () => boolean;
  deleteComment: (commentId: string) => void;
  editComment: (commentId: string) => void;
  saveActiveCommentVal: (val: string) => Promise<void>;
  storeCommentsFromServer: (comments: IComment[]) => void;
  saveComment: () => void;
  getUnpublishedData: () => {
    commentsToPublish: IComment[];
    commentIdsToDelete: string[];
  };
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  publishedCommentIds: [],
  savedComments: {},
  draftCommentPerStep: {},
  hasDataToPublish: () => {
    const savedComments = Object.values(get().savedComments).flat();

    const draftComments = Object.values(get().draftCommentPerStep).filter(
      (step) => step.commentBody !== ''
    );

    const commentsToPush = savedComments.filter(
      (comment) => !get().publishedCommentIds.includes(comment.commentId)
    );

    const commentsToDelete = get().publishedCommentIds.filter((commentId) => {
      return !savedComments.find((comment) => comment.commentId === commentId);
    });

    return (
      draftComments.length > 0 ||
      commentsToPush.length > 0 ||
      commentsToDelete.length > 0
    );
  },

  editComment: (commentId: string) => {
    const { savedComments } = get();

    const commentToEdit = Object.values(savedComments)
      .flat()
      .find((comment) => comment.commentId === commentId);

    if (!commentToEdit) {
      throw new Error('cant find comment to edit');
    }

    set({
      draftCommentPerStep: produce(get().draftCommentPerStep, (draftObj) => {
        draftObj[commentToEdit.stepId] = {
          ...commentToEdit,
          isEditing: true,
        };
      }),
    });
  },

  saveActiveCommentVal: async (val: string) => {
    const activeStepId = useStepsStore.getState().activeStepId;
    const { draftCommentPerStep } = get();

    if (!activeStepId) {
      throw new Error('cant save note, invalid activeStepId');
    }

    const commentToEdit = draftCommentPerStep[activeStepId]?.isEditing
      ? draftCommentPerStep[activeStepId]
      : undefined;

    const session = useUserStore.getState().userSession;

    const newDraftCommentPerStep = produce(
      get().draftCommentPerStep,
      (draftObj) => {
        draftObj[activeStepId] = {
          isEditing: Boolean(commentToEdit),
          isMine: true,
          githubUserId: session?.user?.id || '',
          commentBody: val,
          commentId: commentToEdit ? commentToEdit.commentId : generateId(),
          stepId: activeStepId,
          timestamp: Date.now(),
        };
      }
    );

    set({ draftCommentPerStep: newDraftCommentPerStep });
  },

  deleteComment: (commentId: string) => {
    const { savedComments } = get();

    const newSavedComments = produce(savedComments, (draftObj) => {
      for (const stepId of Object.keys(draftObj)) {
        draftObj[stepId] = draftObj[stepId].filter(
          (comment) => comment.commentId !== commentId
        );
      }
    });

    set({ savedComments: newSavedComments });
  },

  saveComment: () => {
    const activeStepId = useStepsStore.getState().activeStepId;
    const { savedComments, draftCommentPerStep: draftCommentPerStep } = get();

    if (!activeStepId) {
      throw new Error('cant save comment, invalid activeStepId');
    }
    if (!draftCommentPerStep[activeStepId]) {
      throw new Error('comment is empty');
    }

    const commentToEdit = draftCommentPerStep[activeStepId]?.isEditing
      ? draftCommentPerStep[activeStepId]
      : undefined;

    const newSavedComments = produce(savedComments, (savedCommentsTemp) => {
      const newComment = draftCommentPerStep[activeStepId];

      if (commentToEdit) {
        // edit existing comment
        const commentIndexToEdit = savedCommentsTemp[activeStepId].findIndex(
          (c) => c.commentId === commentToEdit.commentId
        );

        if (commentIndexToEdit !== -1) {
          savedCommentsTemp[activeStepId][commentIndexToEdit] = newComment;
        }
      } else {
        // add new comment
        savedCommentsTemp[activeStepId] = [
          ...(savedCommentsTemp[activeStepId] || []),
          newComment,
        ];
      }
    });

    set({
      savedComments: newSavedComments,
      draftCommentPerStep: produce(draftCommentPerStep, (draftObj) => {
        delete draftObj[activeStepId];
      }),
    });
  },

  getUnpublishedData: () => {
    const {
      savedComments,
      draftCommentPerStep: draftCommentPerStep,
      publishedCommentIds,
    } = get();

    // undraft all comments
    for (const stepId of Object.keys(useStepsStore.getState().steps)) {
      if (!draftCommentPerStep[stepId]) {
        continue;
      }

      const newSavedComments = produce(savedComments, (draftObj) => {
        draftObj[stepId] = [
          ...(draftObj[stepId] || []),
          draftCommentPerStep[stepId],
        ];
      });
      const newDraftCommentPerStep = produce(
        draftCommentPerStep,
        (draftObj) => {
          delete draftObj[stepId];
        }
      );

      set({
        draftCommentPerStep: newDraftCommentPerStep,
        savedComments: newSavedComments,
      });
    }

    const savedCommentsArr = Object.values(get().savedComments).flat();

    const commentsToPublish = savedCommentsArr.filter(
      (comment) => !publishedCommentIds.includes(comment.commentId)
    );

    const commentIdsToDelete = publishedCommentIds.filter((commentId) => {
      return !savedCommentsArr.find(
        (comment) => comment.commentId === commentId
      );
    });

    return {
      commentsToPublish,
      commentIdsToDelete,
    };
  },

  storeCommentsFromServer: (comments: IComment[]) => {
    const commentsPerStep = produce(get().savedComments, (draftObj) => {
      for (const comment of comments) {
        if (!draftObj[comment.stepId]) {
          draftObj[comment.stepId] = [];
        }
        const stepComments = draftObj[comment.stepId];

        if (!stepComments.find((c) => c.commentId === comment.commentId)) {
          stepComments.push(comment);
        }
      }
    });

    set({
      savedComments: commentsPerStep,
      publishedCommentIds: comments.map((c) => c.commentId),
    });
  },
}));
