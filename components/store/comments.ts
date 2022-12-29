import produce from 'immer';
import { ulid } from 'ulid';
import create from 'zustand';

import { fetchWithThrow } from '../../utils/fetchWithThrow';
import { useChangesStore } from './changes';
import { useGuideStore } from './guide';
import { useUserStore } from './user';

export type IComment = {
  githubUserId: string;
  commentId: string;
  changeId: string;
  commentBody: string;
  timestamp: number;
};
interface CommentsState {
  publishedCommentIds: string[];
  savedComments: Record<string, IComment[]>;
  draftCommentPerChange: Record<string, IComment>;
  hasDataToPublish: () => boolean;
  saveActiveCommentVal: (val: string) => Promise<void>;
  storeCommentsFromServer: (comments: IComment[]) => void;
  createNewComment: () => void;
  publishComments: () => Promise<{ success: boolean; error?: string }>;
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  publishedCommentIds: [],
  savedComments: {},
  draftCommentPerChange: {},
  hasDataToPublish: () => {
    const savedCommentsIds = Object.entries(get().savedComments)
      .map(([, changeComments]) => {
        return changeComments.map((comment) => comment.commentId);
      })
      .flat();

    const draftComments = Object.values(get().draftCommentPerChange).filter(
      (change) => change.commentBody !== ''
    );

    const commentsToPush = savedCommentsIds.filter(
      (commentId) => !get().publishedCommentIds.includes(commentId)
    );

    const commentIdsToDelete = get().publishedCommentIds.filter((id) => {
      !savedCommentsIds.includes(id);
    });

    return (
      draftComments.length > 0 ||
      commentsToPush.length > 0 ||
      commentIdsToDelete.length > 0
    );
  },
  saveActiveCommentVal: async (val: string) => {
    const activeChangeId = useChangesStore.getState().activeChangeId;

    if (!activeChangeId) {
      throw new Error('cant save note, invalid activeChangeId');
    }

    const session = await useUserStore.getState().getUserSession();

    const draftCommentPerChange = produce(
      get().draftCommentPerChange,
      (draftObj) => {
        draftObj[activeChangeId] = {
          githubUserId: session?.user?.id || '',
          commentBody: val,
          commentId: ulid(),
          changeId: activeChangeId,
          timestamp: Date.now(),
        };
      }
    );

    set({ draftCommentPerChange });
  },

  createNewComment: () => {
    const activeChangeId = useChangesStore.getState().activeChangeId;
    const { savedComments, draftCommentPerChange } = get();

    if (!activeChangeId) {
      throw new Error('cant save comment, invalid activeChangeId');
    }
    if (!draftCommentPerChange[activeChangeId]) {
      throw new Error('comment is empty');
    }

    const newSavedComments = produce(savedComments, (draftObj) => {
      draftObj[activeChangeId] = [
        ...(draftObj[activeChangeId] || []),
        draftCommentPerChange[activeChangeId],
      ];
    });
    const newDraftCommentPerChange = produce(
      draftCommentPerChange,
      (draftObj) => {
        delete draftObj[activeChangeId];
      }
    );

    set({
      draftCommentPerChange: newDraftCommentPerChange,
      savedComments: newSavedComments,
    });
  },

  publishComments: async () => {
    const { savedComments, draftCommentPerChange } = get();

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
      (comment) => !get().publishedCommentIds.includes(comment.commentId)
    );

    const commentIdsToDelete = get().publishedCommentIds.filter((id) => {
      !savedCommentsArr.map((c) => c.commentId).includes(id);
    });

    const guideId = useGuideStore.getState().id;

    try {
      if (commentIdsToDelete.length) {
        await fetchWithThrow(`/api/comments?guideId=${guideId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ commentIds: commentIdsToDelete }),
        }).then((deleted: string[]) => {
          set({
            publishedCommentIds: get().publishedCommentIds.filter(
              (id) => !deleted.includes(id)
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
      }).then((pushed: string[]) => {
        set({
          publishedCommentIds: [...get().publishedCommentIds, ...pushed],
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
    const newSavedComments = produce(get().savedComments, (draftObj) => {
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
      savedComments: newSavedComments,
      publishedCommentIds: comments.map((comment) => comment.commentId),
    });
  },
}));
