import { DynamoDB } from 'aws-sdk';

export const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.AWS_APP_REGION,
  credentials: {
    accessKeyId: process.env.AWS_APP_ACCESS_KEY,
    secretAccessKey: process.env.AWS_APP_SECRET_KEY,
  },
});
