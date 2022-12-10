import z from 'zod';

import { IGuide } from '../types/Guide';
import { dynamoDb } from './dynamoDb';

export async function deleteChanges({
  email,
  guide,
  changeIds,
}: {
  email: string;
  guide: IGuide;
  changeIds: unknown;
}) {
  try {
    if (!guide?.canEdit.includes(email)) {
      return {
        statusCode: 401,
        json: { error: 'Unauthorized' },
      };
    }

    const changeIdsParsed = z.array(z.string()).parse(changeIds);

    const deleteRequests = changeIdsParsed.map((changeId) => {
      return {
        DeleteRequest: {
          Key: {
            guideId: guide.id,
            changeId: changeId,
          },
        },
      };
    });

    await dynamoDb
      .batchWrite({
        RequestItems: {
          [process.env.DYNAMODB_CHANGES_TABLE]: deleteRequests,
        },
      })
      .promise();

    return {
      statusCode: 200,
      json: changeIdsParsed,
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
      json: { error: "Couldn't delete changes." },
    };
  }
}
