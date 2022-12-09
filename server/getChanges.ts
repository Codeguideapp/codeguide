import { DynamoDB } from 'aws-sdk';

import { Change } from '../components/store/changes';

const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.AWS_APP_REGION,
  credentials: {
    accessKeyId: process.env.AWS_APP_ACCESS_KEY,
    secretAccessKey: process.env.AWS_APP_SECRET_KEY,
  },
});

export function getChanges(guideId: string): Promise<Change[]> {
  return dynamoDb
    .query({
      TableName: process.env.DYNAMODB_CHANGES_TABLE,
      KeyConditionExpression: 'guideId = :guideId',
      ExpressionAttributeValues: {
        ':guideId': guideId,
      },
    })
    .promise()
    .then((res) =>
      (res.Items as any[]).map((change) => {
        const { changeId, ...rest } = change;
        return {
          ...rest,
          id: changeId,
        };
      })
    );
}
