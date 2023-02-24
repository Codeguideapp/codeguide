import { DynamoDB } from 'aws-sdk';

import { Step } from '../components/store/steps';

const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.AWS_APP_REGION,
  credentials: {
    accessKeyId: process.env.AWS_APP_ACCESS_KEY,
    secretAccessKey: process.env.AWS_APP_SECRET_KEY,
  },
});

export function getChanges(guideId: string): Promise<Step[]> {
  return dynamoDb
    .query({
      TableName: process.env.DYNAMODB_STEPS_TABLE,
      KeyConditionExpression: 'guideId = :guideId',
      ExpressionAttributeValues: {
        ':guideId': guideId,
      },
    })
    .promise()
    .then((res) =>
      (res.Items as any[]).map((step) => {
        console.log(step);
        const { stepId, ...rest } = step;
        return {
          ...rest,
          id: stepId,
        };
      })
    );
}
