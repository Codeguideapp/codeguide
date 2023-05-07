import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { StepZod } from '../../../types/StepZod';
import { getGuideInfo } from '../../getGuideInfo';
import { publishComments } from '../../publishComments';
import { publishSteps } from '../../publishSteps';
import { updateGuide } from '../../updateGuide';
import { protectedProcedure } from '../trpc';

export const CommentZod = z.object({
  stepId: z.string(),
  commentId: z.string(),
  commentBody: z.string(),
  timestamp: z.number(),
});

export const publishGuide = protectedProcedure
  .input(
    z.object({
      guideId: z.string(),
      saveSteps: z.array(StepZod),
      deleteSteps: z.array(z.string()),
      saveComments: z.array(CommentZod),
      deleteCommentIds: z.array(z.string()),
      guideFiles: z.array(z.object({ path: z.string() })),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const email = ctx.session.user.email;

    try {
      const guide = await getGuideInfo(input.guideId);
      if (!guide?.canEdit.includes(email)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await updateGuide(guide.id, 'guideFiles', input.guideFiles);

      const steps = await publishSteps({
        guideId: guide.id,
        deleteSteps: input.deleteSteps,
        saveSteps: input.saveSteps,
      });
      const comments = await publishComments({
        guideId: guide.id,
        githubUserId: ctx.session.user.id,
        deleteCommentIds: input.deleteCommentIds,
        saveComments: input.saveComments,
      });

      return {
        steps,
        comments,
      };
    } catch (e) {
      console.error(e);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
  });
