import { z } from 'zod';

export const GuideZod = z.object({
  type: z.union([z.literal('diff'), z.literal('browse')]),
  id: z.string(),
  createdBy: z.string(),
  owner: z.string(),
  repository: z.string(),
  baseSha: z.string(),
  prNum: z.number().optional(),
  mergeCommitSha: z.string().optional(),
  canEdit: z.array(z.string()),
  fileRefs: z.array(
    z.object({
      path: z.string(),
      sha: z.string(),
      url: z.string(),
      type: z.union([z.literal('tree'), z.literal('blob')]),
      origin: z.union([
        z.literal('commit'),
        z.literal('pr'),
        z.literal('virtual'),
      ]),
      isAdded: z.boolean().optional(),
      isDeleted: z.boolean().optional(),
    })
  ),
  guideFiles: z.array(
    z.object({
      path: z.string(),
    })
  ),
  privateRepoWhenCreated: z.boolean(),
  createdAt: z.number(),
});

export type Guide = z.infer<typeof GuideZod>;
