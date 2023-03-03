import { omit } from 'lodash';
import { z } from 'zod';

import { StepZod } from './api/routers/guide/publishGuide';
import { dynamoDb } from './dynamoDb';

const MAX_BATCH_SIZE = 25;
type Step = z.infer<typeof StepZod>;

export async function publishSteps({
  guideId,
  deleteSteps,
  saveSteps,
}: {
  guideId: string;
  deleteSteps: string[];
  saveSteps: Step[];
}): Promise<{ deletedIds: string[]; savedIds: string[] }> {
  const deleteStepsSliced = deleteSteps.slice(0, MAX_BATCH_SIZE);
  const saveStepsSliced = saveSteps.slice(0, MAX_BATCH_SIZE);

  const deleteRequests = deleteStepsSliced.map((stepId) => {
    return {
      DeleteRequest: {
        Key: {
          guideId,
          stepId,
        },
      },
    };
  });

  if (deleteStepsSliced.length > 0) {
    await dynamoDb
      .batchWrite({
        RequestItems: {
          [process.env.DYNAMODB_STEPS_TABLE]: deleteRequests,
        },
      })
      .promise();
  }

  if (saveStepsSliced.length > 0) {
    await dynamoDb
      .batchWrite({
        RequestItems: {
          [process.env.DYNAMODB_STEPS_TABLE]: saveStepsSliced.map((step) => {
            return {
              PutRequest: {
                Item: omit(
                  {
                    guideId,
                    stepId: step.id,
                    ...step,
                  },
                  ['id']
                ),
              },
            };
          }),
        },
      })
      .promise();
  }

  if (
    deleteSteps.length > MAX_BATCH_SIZE ||
    saveSteps.length > MAX_BATCH_SIZE
  ) {
    return publishSteps({
      guideId,
      deleteSteps: deleteSteps.slice(MAX_BATCH_SIZE),
      saveSteps: saveSteps.slice(MAX_BATCH_SIZE),
    });
  } else {
    return {
      deletedIds: deleteSteps,
      savedIds: saveSteps.map((c) => c.id),
    };
  }
}
