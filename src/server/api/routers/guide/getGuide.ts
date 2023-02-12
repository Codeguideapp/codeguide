import { TRPCError } from '@trpc/server';
import { Octokit } from 'octokit';
import { z } from 'zod';

import { getChanges } from '../../../getChanges';
import { getComments } from '../../../getComments';
import { getGuideInfo } from '../../../getGuideInfo';
import { publicProcedure } from '../../trpc';

export const getGuide = publicProcedure
  .input(z.object({ guideId: z.string() }))
  .query(async ({ input, ctx }) => {
    const guide = await getGuideInfo(input.guideId);

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
  });
