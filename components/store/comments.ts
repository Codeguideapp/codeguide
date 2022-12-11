import produce from 'immer';
import { ulid } from 'ulid';
import create from 'zustand';

import { fetchWithThrow } from '../../utils/fetchWithThrow';
import { useChangesStore } from './changes';
import { useGuideStore } from './guide';

export type IComment = {
  commentId: string;
  changeId: string;
  commentBody: string;
};
interface CommentsState {
  pushedCommentIds: string[];
  committedComments: Record<
    string,
    { commentBody: string; commentId: string }[] // todo: use IComment
  >;
  stagedComments: Record<string, { commentBody: string; commentId: string }>;
  saveActiveNoteVal: (val: string) => void;
  storeCommentsFromServer: (comments: IComment[]) => void;
  createNewComment: () => void;
  pushComments: () => void;
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  pushedCommentIds: [],
  committedComments: {},
  stagedComments: {},

  saveActiveNoteVal: (val: string) => {
    const activeChangeId = useChangesStore.getState().activeChangeId;

    if (!activeChangeId) {
      throw new Error('cant save note, invalid activeChangeId');
    }

    const notes = get().stagedComments;
    const newNotes = produce(notes, (notesDraft) => {
      notesDraft[activeChangeId] = {
        commentBody: val,
        commentId: ulid(),
      };
    });

    set({ stagedComments: newNotes });
  },

  createNewComment: () => {
    const activeChangeId = useChangesStore.getState().activeChangeId;
    const { committedComments, stagedComments } = get();

    if (!activeChangeId) {
      throw new Error('cant save note, invalid activeChangeId');
    }
    if (!stagedComments[activeChangeId]) {
      throw new Error('comment is empty');
    }

    const newCommittedComments = produce(committedComments, (draftObj) => {
      draftObj[activeChangeId] = [
        ...(draftObj[activeChangeId] || []),
        stagedComments[activeChangeId],
      ];
    });
    const newStagedComments = produce(stagedComments, (draftObj) => {
      delete draftObj[activeChangeId];
    });

    set({
      stagedComments: newStagedComments,
      committedComments: newCommittedComments,
    });
  },

  pushComments: async () => {
    // todo: undraft all comments

    const commitedCommentsArr = Object.entries(get().committedComments)
      .map(([changeId, changeComments]) => {
        return changeComments.map((comment) => {
          return {
            changeId,
            commentId: comment.commentId,
            commentBody: comment.commentBody,
          };
        });
      })
      .flat();

    const commentsToPush = commitedCommentsArr.filter(
      (comment) => !get().pushedCommentIds.includes(comment.commentId)
    );

    const guideId = useGuideStore.getState().id;

    const commentIdsToDelete = get().pushedCommentIds.filter((id) => {
      !commitedCommentsArr.map((c) => c.commentId).includes(id);
    });

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
            pushedCommentIds: get().pushedCommentIds.filter(
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
          pushedCommentIds: [...get().pushedCommentIds, ...pushed],
        });

        // If there are more changes to save, send another request
        if (commentsToPush.length > 25) {
          return get().pushComments();
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
    const newCommittedComments = produce(
      get().committedComments,
      (draftObj) => {
        for (const comment of comments) {
          if (!draftObj[comment.changeId]) {
            draftObj[comment.changeId] = [];
          }
          const changeComments = draftObj[comment.changeId];

          if (!changeComments.find((c) => c.commentId === comment.commentId)) {
            changeComments.push({
              commentBody: comment.commentBody,
              commentId: comment.commentId,
            });
          }
        }
      }
    );

    set({
      committedComments: newCommittedComments,
      pushedCommentIds: comments.map((comment) => comment.commentId),
    });
  },
}));
