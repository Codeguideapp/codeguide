import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.AWS_APP_REGION,
  credentials: {
    accessKeyId: process.env.AWS_APP_ACCESS_KEY,
    secretAccessKey: process.env.AWS_APP_SECRET_KEY,
  },
});

export function getGuide(id: string) {
  return dynamoDb
    .get({
      TableName: process.env.DYNAMODB_GUIDES_TABLE,
      Key: {
        id,
      },
    })
    .promise()
    .then((result) => result.Item);
}
