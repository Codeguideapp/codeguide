import { omit } from 'lodash';
import z from 'zod';

import { IGuide } from '../types/Guide';
import { dynamoDb } from './dynamoDb';

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

export async function saveChanges({
  email,
  guide,
  changesBody,
}: {
  email: string;
  guide: IGuide;
  changesBody: any;
}) {
  try {
    if (!guide?.canEdit.includes(email)) {
      return {
        statusCode: 401,
        json: { error: 'Unauthorized' },
      };
    }

    const changes = Changes.parse(changesBody);

    await dynamoDb
      .batchWrite({
        RequestItems: {
          [process.env.DYNAMODB_CHANGES_TABLE]: changes.map((change) => {
            return {
              PutRequest: {
                Item: omit(
                  {
                    guideId: guide.id,
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

    return {
      statusCode: 200,
      json: changes.map((c) => c.id),
    };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        json: error,
      };
    }
    console.error(error);

    return {
      statusCode: error?.statusCode || 500,
      json: { error: "Couldn't save changes." },
    };
  }
}
