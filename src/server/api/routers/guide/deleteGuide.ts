import { TRPCError } from '@trpc/server';
import type { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { z } from 'zod';

import { dynamoDb } from '../../../dynamoDb';
import { protectedProcedure } from '../../trpc';

export const deleteGuide = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const email = ctx.session.user.email;

    try {
      const resGet = await dynamoDb
        .get({
          TableName: process.env.DYNAMODB_GUIDES_TABLE,
          Key: {
            id: input.id,
          },
        })
        .promise();

      if (resGet.Item?.createdBy !== email) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await deleteAllForPrimaryKey({
        primaryKeyName: 'guideId',
        primaryKeyValue: input.id,
        tableName: process.env.DYNAMODB_CHANGES_TABLE,
        sortKeyName: 'changeId',
      });

      await deleteAllForPrimaryKey({
        primaryKeyName: 'guideId',
        primaryKeyValue: input.id,
        tableName: process.env.DYNAMODB_COMMENTS_TABLE,
        sortKeyName: 'commentId',
      });

      await dynamoDb
        .delete({
          TableName: process.env.DYNAMODB_GUIDES_TABLE,
          Key: {
            id: input.id,
          },
        })
        .promise();
    } catch (e) {
      console.error(e);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
  });

async function deleteAllForPrimaryKey({
  tableName,
  primaryKeyName,
  primaryKeyValue,
  sortKeyName,
}: {
  tableName: string;
  primaryKeyName: string;
  primaryKeyValue: string;
  sortKeyName: string;
}) {
  let queryRes: DocumentClient.QueryOutput | null = null;
  const itemsToDelete: DocumentClient.Key[] = [];

  do {
    queryRes = await dynamoDb
      .query({
        TableName: tableName,
        KeyConditionExpression: `${primaryKeyName} = :primaryKeyValue`,
        ExpressionAttributeValues: {
          ':primaryKeyValue': primaryKeyValue,
        },
        ProjectionExpression: `${primaryKeyName}, ${sortKeyName}`,
        ExclusiveStartKey: queryRes ? queryRes.LastEvaluatedKey : undefined,
      })
      .promise();

    if (queryRes?.Items) {
      itemsToDelete.push(
        ...queryRes?.Items.map((item) => ({
          [primaryKeyName]: item[primaryKeyName],
          [sortKeyName]: item[sortKeyName],
        }))
      );
    }
  } while (queryRes.LastEvaluatedKey);

  const promises = itemsToDelete.map((item) =>
    dynamoDb
      .delete({
        TableName: tableName,
        Key: item,
      })
      .promise()
  );

  return Promise.all(promises);
}
