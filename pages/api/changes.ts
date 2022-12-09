import { DynamoDB } from 'aws-sdk';
import { omit } from 'lodash';
import type { NextApiRequest, NextApiResponse } from 'next';
import z from 'zod';

import { getGuide } from '../../server/getGuide';
import { getUserSession } from '../../server/getUserSession';

const Delta = z.object({
  ops: z.array(
    z.object({
      insert: z.string().optional(),
      delete: z.number().optional(),
      retain: z.number().optional(),
    })
  ),
});

const Change = z.object({
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
  delta: Delta,
  deltaInverted: Delta.optional(),
  stat: z.array(z.number()),
});

const Changes = z.array(Change);

const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.AWS_APP_REGION,
  credentials: {
    accessKeyId: process.env.AWS_APP_ACCESS_KEY,
    secretAccessKey: process.env.AWS_APP_SECRET_KEY,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const guideId = req.query.guideId;

  if (typeof guideId !== 'string') {
    return res.status(400).json({ error: 'guideId is required' });
  }

  try {
    const user = await getUserSession(req, res);
    const guide = await getGuide(guideId);

    if (!guide?.canEdit.includes(user.email)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const changes = Changes.parse(req.body);

    await dynamoDb
      .batchWrite({
        RequestItems: {
          [process.env.DYNAMODB_CHANGES_TABLE]: changes.map((change) => {
            return {
              PutRequest: {
                Item: omit(
                  {
                    guideId,
                    changeId: change.id,
                    ...change,
                  },
                  ['id']
                ),
              },
            };
          }),
        },
      })
      .promise();

    return res.status(200).json(changes.map((c) => c.id));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error);
    }
    console.log(error);

    return res.status(error?.statusCode || 500).send("Couldn't save changes.");
  }
}
