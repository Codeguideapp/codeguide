import z from 'zod';

import { IGuide } from '../types/Guide';
import { dynamoDb } from './dynamoDb';

export async function deleteComments({
  email,
  guide,
  commentIds,
}: {
  email: string;
  guide: IGuide;
  commentIds: unknown;
}) {
  try {
    if (!guide?.canEdit.includes(email)) {
      return {
        statusCode: 401,
        json: { error: 'Unauthorized' },
      };
    }

    const commandIdsParsed = z.array(z.string()).parse(commentIds);

    const deleteRequests = commandIdsParsed.map((commentId) => {
      return {
        DeleteRequest: {
          Key: {
            guideId: guide.id,
            commentId,
          },
        },
      };
    });

    await dynamoDb
      .batchWrite({
        RequestItems: {
          [process.env.DYNAMODB_COMMENTS_TABLE]: deleteRequests,
        },
      })
      .promise();

    return {
      statusCode: 200,
      json: commandIdsParsed,
    };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        json: error,
      };
    }
    console.log(error);

    return {
      statusCode: error?.statusCode || 500,
      json: { error: "Couldn't delete comments." },
    };
  }
}
