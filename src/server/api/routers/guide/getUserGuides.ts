import { TRPCError } from '@trpc/server';

import { IGuide } from '../../../../types/Guide';
import { dynamoDb } from '../../../dynamoDb';
import { protectedProcedure } from '../../trpc';

export const getUserGuides = protectedProcedure.query(async ({ ctx }) => {
  const email = ctx.session.user.email;

  try {
    const res = await dynamoDb
      .query({
        TableName: process.env.DYNAMODB_GUIDES_TABLE,
        IndexName: 'createdBy-createdAt-index',
        KeyConditionExpression: 'createdBy = :createdBy',
        ScanIndexForward: false,
        ExpressionAttributeValues: {
          ':createdBy': email,
        },
      })
      .promise();

    return res.Items as IGuide[];
  } catch (e) {
    console.error(e);
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
  }
});
