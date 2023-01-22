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
  fileRefs: z.array(
    z.object({
      path: z.string(),
      sha: z.string(),
      url: z.string(),
      type: z.union([z.literal('tree'), z.literal('blob')]),
    })
  ),
  changedFileRefs: z.array(
    z.object({
      path: z.string(),
      status: z.union([
        z.literal('added'),
        z.literal('modified'),
        z.literal('deleted'),
      ]),
    })
  ),
});

export type IGuide = z.infer<typeof Guide>;
