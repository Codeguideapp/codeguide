import { z } from 'zod';

export const Guide = z.object({
  type: z.union([z.literal('diff'), z.literal('browse')]),
  id: z.string(),
  createdBy: z.string(),
  owner: z.string(),
  repository: z.string(),
  baseSha: z.string(),
  prNum: z.number().optional(),
  mergeCommitSha: z.string().optional(),
  canEdit: z.array(z.string()),
});

export type IGuide = z.infer<typeof Guide>;
