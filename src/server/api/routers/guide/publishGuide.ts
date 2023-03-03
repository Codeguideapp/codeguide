import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getGuideInfo } from '../../../getGuideInfo';
import { publishComments } from '../../../publishComments';
import { publishSteps } from '../../../publishSteps';
import { protectedProcedure } from '../../trpc';

const DeltaZod = z.object({
  ops: z.array(
    z.object({
      insert: z.any().optional(),
      delete: z.number().optional(),
      retain: z.number().optional(),
    })
  ),
});

export const StepZod = z.object({
  id: z.string(),
  path: z.string(),
  previewOpened: z.boolean(),
  isFileDepChange: z.boolean().optional(),
  isFileNode: z.boolean().optional(),
  fileStatus: z.union([
    z.literal('added'),
    z.literal('modified'),
    z.literal('deleted'),
  ]),
  isDraft: z.boolean(),
  highlight: z.array(
    z.object({
      offset: z.number(),
      length: z.number(),
    })
  ),
  displayName: z.string().optional(),
  renderHtml: z.boolean().optional(),
  delta: DeltaZod,
  deltaInverted: DeltaZod.optional(),
  stat: z.array(z.number()),
});

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
    })
  )
  .mutation(async ({ ctx, input }) => {
    const email = ctx.session.user.email;

    try {
      const guide = await getGuideInfo(input.guideId);
      if (!guide?.canEdit.includes(email)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

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
