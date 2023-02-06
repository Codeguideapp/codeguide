import { TRPCError } from '@trpc/server';
import { Octokit } from 'octokit';
import { z } from 'zod';

import { IGuide } from '../../../types/Guide';
import { dynamoDb } from '../../dynamoDb';
import { getChanges } from '../../getChanges';
import { getComments } from '../../getComments';
import { getGuide } from '../../getGuide';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

export const guideRouter = createTRPCRouter({
  getGuide: publicProcedure
    .input(z.object({ guideId: z.string() }))
    .query(async ({ input, ctx }) => {
      const guide = await getGuide(input.guideId);

      if (!guide) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const octokit = new Octokit({
        auth: ctx.session?.user.accessToken,
      });

      const checkStatus = await octokit
        .request('GET /repos/{owner}/{repo}', {
          owner: guide.owner,
          repo: guide.repository,
        })
        .then((res) => res.status)
        .catch((e) => e.status);

      if (checkStatus !== 200) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const changes = await getChanges(input.guideId);
      const comments = await getComments(input.guideId, ctx.session?.user.id);

      return {
        guide,
        changes,
        comments,
      };
    }),
  getUserGuides: protectedProcedure.query(async ({ ctx }) => {
    const email = ctx.session.user.email;

    try {
      const res = await dynamoDb
        .query({
          TableName: process.env.DYNAMODB_GUIDES_TABLE,
          IndexName: 'createdBy-createdAt-index',
          KeyConditionExpression: 'createdBy = :createdBy',
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
  }),
});
