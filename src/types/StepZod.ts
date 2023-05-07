import { z } from 'zod';

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
  introStep: z.boolean().optional(),
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
  renderHtml: z.boolean().optional(),
  delta: DeltaZod,
  deltaInverted: DeltaZod.optional(),
  stat: z.array(z.number()),
  highlightPaths: z.array(z.string()).optional(),
});
