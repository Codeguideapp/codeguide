import { omit } from 'lodash';
import z from 'zod';

import { IGuide } from '../types/Guide';
import { dynamoDb } from './dynamoDb';

const Comments = z.array(
  z.object({
    changeId: z.string(),
    commentId: z.string(),
    commentBody: z.string(),
  })
);

export async function saveComments({
  email,
  guide,
  comments,
}: {
  email: string;
  guide: IGuide;
  comments: unknown;
}) {
  try {
    if (!guide?.canEdit.includes(email)) {
      return {
        statusCode: 401,
        json: { error: 'Unauthorized' },
      };
    }

    const commentsParsed = Comments.parse(comments);

    await dynamoDb
      .batchWrite({
        RequestItems: {
          [process.env.DYNAMODB_COMMENTS_TABLE]: commentsParsed.map(
            (comment) => {
              return {
                PutRequest: {
                  Item: {
                    guideId: guide.id,
                    ...comment,
                  },
                },
              };
            }
          ),
        },
      })
      .promise();

    return {
      statusCode: 200,
      json: commentsParsed.map((c) => c.commentId),
    };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        json: error,
      };
    }
    console.error(error);

    return {
      statusCode: error?.statusCode || 500,
      json: { error: "Couldn't save comments." },
    };
  }
}
