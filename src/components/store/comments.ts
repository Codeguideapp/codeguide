import produce from 'immer';
import { ulid } from 'ulid';
import create from 'zustand';

import { fetchWithThrow } from '../../utils/fetchWithThrow';
import { generateId } from '../../utils/generateId';
import { useChangesStore } from './changes';
import { useGuideStore } from './guide';
import { useUserStore } from './user';

export type IComment = {
  isMine: boolean;
  githubUserId: string;
  commentId: string;
  changeId: string;
  commentBody: string;
  timestamp: number;
};
interface CommentsState {
  publishedComments: IComment[];
  savedComments: Record<string, IComment[]>;
  draftCommentPerChange: Record<string, IComment & { isEditing: boolean }>;
  hasDataToPublish: () => boolean;
  deleteComment: (commentId: string) => void;
  editComment: (commentId: string) => void;
  saveActiveCommentVal: (val: string) => Promise<void>;
  storeCommentsFromServer: (comments: IComment[]) => void;
  saveComment: () => void;
  publishComments: () => Promise<{ success: boolean; error?: string }>;
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  publishedComments: [],
  savedComments: {},
  draftCommentPerChange: {},
  activeCommentIdPerChange: {},
  hasDataToPublish: () => {
    const savedComments = Object.values(get().savedComments).flat();

    const draftComments = Object.values(get().draftCommentPerChange).filter(
      (change) => change.commentBody !== ''
    );

    const commentsToPush = savedComments.filter(
      (comment) => !containsComment(get().publishedComments, comment)
    );

    const commentsToDelete = get().publishedComments.filter((comment) => {
      return !containsComment(savedComments, comment);
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
      draftCommentPerChange: produce(
        get().draftCommentPerChange,
        (draftObj) => {
          draftObj[commentToEdit.changeId] = {
            ...commentToEdit,
            isEditing: true,
          };
        }
      ),
    });
  },

  saveActiveCommentVal: async (val: string) => {
    const activeChangeId = useChangesStore.getState().activeChangeId;
    const { draftCommentPerChange } = get();

    if (!activeChangeId) {
      throw new Error('cant save note, invalid activeChangeId');
    }

    const commentToEdit = draftCommentPerChange[activeChangeId]?.isEditing
      ? draftCommentPerChange[activeChangeId]
      : undefined;

    const session = useUserStore.getState().userSession;

    const newDraftCommentPerChange = produce(
      get().draftCommentPerChange,
      (draftObj) => {
        draftObj[activeChangeId] = {
          isEditing: Boolean(commentToEdit),
          isMine: true,
          githubUserId: session?.user?.id || '',
          commentBody: val,
          commentId: commentToEdit ? commentToEdit.commentId : generateId(),
          changeId: activeChangeId,
          timestamp: Date.now(),
        };
      }
    );

    set({ draftCommentPerChange: newDraftCommentPerChange });
  },

  deleteComment: (commentId: string) => {
    const { savedComments } = get();

    const newSavedComments = produce(savedComments, (draftObj) => {
      for (const changeId of Object.keys(draftObj)) {
        draftObj[changeId] = draftObj[changeId].filter(
          (comment) => comment.commentId !== commentId
        );
      }
    });

    set({ savedComments: newSavedComments });
  },

  saveComment: () => {
    const activeChangeId = useChangesStore.getState().activeChangeId;
    const { savedComments, draftCommentPerChange } = get();

    if (!activeChangeId) {
      throw new Error('cant save comment, invalid activeChangeId');
    }
    if (!draftCommentPerChange[activeChangeId]) {
      throw new Error('comment is empty');
    }

    const commentToEdit = draftCommentPerChange[activeChangeId]?.isEditing
      ? draftCommentPerChange[activeChangeId]
      : undefined;

    const newSavedComments = produce(savedComments, (savedCommentsTemp) => {
      const newComment = draftCommentPerChange[activeChangeId];

      if (commentToEdit) {
        // edit existing comment
        const commentIndexToEdit = savedCommentsTemp[activeChangeId].findIndex(
          (c) => c.commentId === commentToEdit.commentId
        );

        if (commentIndexToEdit !== -1) {
          savedCommentsTemp[activeChangeId][commentIndexToEdit] = newComment;
        }
      } else {
        // add new comment
        savedCommentsTemp[activeChangeId] = [
          ...(savedCommentsTemp[activeChangeId] || []),
          newComment,
        ];
      }
    });

    set({
      savedComments: newSavedComments,
      draftCommentPerChange: produce(draftCommentPerChange, (draftObj) => {
        delete draftObj[activeChangeId];
      }),
    });
  },

  publishComments: async () => {
    const { savedComments, draftCommentPerChange, publishedComments } = get();

    // undraft all comments
    for (const changeId of Object.keys(useChangesStore.getState().changes)) {
      if (!draftCommentPerChange[changeId]) {
        continue;
      }

      const newSavedComments = produce(savedComments, (draftObj) => {
        draftObj[changeId] = [
          ...(draftObj[changeId] || []),
          draftCommentPerChange[changeId],
        ];
      });
      const newDraftCommentPerChange = produce(
        draftCommentPerChange,
        (draftObj) => {
          delete draftObj[changeId];
        }
      );

      set({
        draftCommentPerChange: newDraftCommentPerChange,
        savedComments: newSavedComments,
      });
    }

    const savedCommentsArr = Object.values(get().savedComments).flat();

    const commentsToPush = savedCommentsArr.filter(
      (comment) => !containsComment(publishedComments, comment)
    );

    const commentIdsToDelete = publishedComments
      .filter((comment) => {
        return !containsComment(savedCommentsArr, comment);
      })
      .map((c) => c.commentId);

    const guideId = useGuideStore.getState().id;

    try {
      if (commentIdsToDelete.length) {
        await fetchWithThrow(`/api/comments?guideId=${guideId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ commentIds: commentIdsToDelete }),
        }).then((deletedIds: string[]) => {
          set({
            publishedComments: get().publishedComments.filter(
              (comment) => !deletedIds.includes(comment.commentId)
            ),
          });
        });
      }

      if (commentsToPush.length === 0) {
        return {
          success: true,
        };
      }

      await fetchWithThrow(`/api/comments?guideId=${guideId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comments: commentsToPush.slice(0, 25),
        }),
      }).then((savedCommentIds: string[]) => {
        const savedComments = savedCommentIds.map(
          (commentId) =>
            savedCommentsArr.find((c) => c.commentId === commentId)!
        );

        set({
          publishedComments: [...get().publishedComments, ...savedComments],
        });

        // If there are more changes to save, send another request
        if (commentsToPush.length > 25) {
          return get().publishComments();
        } else {
          return {
            success: true,
          };
        }
      });

      return {
        success: true,
      };
    } catch (err: any) {
      console.error(err);
      return {
        success: false,
        error: err.message,
      };
    }
  },

  storeCommentsFromServer: (comments: IComment[]) => {
    const commentsPerChange = produce(get().savedComments, (draftObj) => {
      for (const comment of comments) {
        if (!draftObj[comment.changeId]) {
          draftObj[comment.changeId] = [];
        }
        const changeComments = draftObj[comment.changeId];

        if (!changeComments.find((c) => c.commentId === comment.commentId)) {
          changeComments.push(comment);
        }
      }
    });

    set({
      savedComments: commentsPerChange,
      publishedComments: comments,
    });
  },
}));

function containsComment(comments: IComment[], checkComment: IComment) {
  const getCommentHash = (comment: IComment) =>
    `${comment.commentId}:${comment.timestamp}`;

  return comments.map(getCommentHash).includes(getCommentHash(checkComment));
}
