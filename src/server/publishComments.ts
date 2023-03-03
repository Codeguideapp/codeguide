import { z } from 'zod';

import { CommentZod } from './api/procedures/publishGuide';
import { dynamoDb } from './dynamoDb';

const MAX_BATCH_SIZE = 25;

type Comment = z.infer<typeof CommentZod>;

export async function publishComments({
  guideId,
  githubUserId,
  saveComments,
  deleteCommentIds,
}: {
  guideId: string;
  githubUserId: string;
  deleteCommentIds: string[];
  saveComments: Comment[];
}): Promise<{ deletedIds: string[]; savedIds: string[] }> {
  const deleteCommentsSliced = deleteCommentIds.slice(0, MAX_BATCH_SIZE);
  const saveCommentsSliced = saveComments.slice(0, MAX_BATCH_SIZE);

  const deleteRequests = deleteCommentsSliced.map((commentId) => {
    return {
      DeleteRequest: {
        Key: {
          guideId,
          commentId,
        },
      },
    };
  });

  if (deleteRequests.length > 0) {
    await dynamoDb
      .batchWrite({
        RequestItems: {
          [process.env.DYNAMODB_COMMENTS_TABLE]: deleteRequests,
        },
      })
      .promise();
  }

  if (saveCommentsSliced.length > 0) {
    await dynamoDb
      .batchWrite({
        RequestItems: {
          [process.env.DYNAMODB_COMMENTS_TABLE]: saveCommentsSliced.map(
            (comment) => {
              return {
                PutRequest: {
                  Item: {
                    guideId,
                    githubUserId,
                    ...comment,
                  },
                },
              };
            }
          ),
        },
      })
      .promise();
  }

  if (
    deleteCommentIds.length > MAX_BATCH_SIZE ||
    saveComments.length > MAX_BATCH_SIZE
  ) {
    return publishComments({
      guideId,
      githubUserId,
      deleteCommentIds: deleteCommentIds.slice(MAX_BATCH_SIZE),
      saveComments: saveComments.slice(MAX_BATCH_SIZE),
    });
  } else {
    return {
      deletedIds: deleteCommentIds,
      savedIds: saveComments.map((c) => c.commentId),
    };
  }
}
