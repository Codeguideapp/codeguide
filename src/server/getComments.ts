import { DynamoDB } from 'aws-sdk';

import { IComment } from '../components/store/comments';

const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.AWS_APP_REGION,
  credentials: {
    accessKeyId: process.env.AWS_APP_ACCESS_KEY,
    secretAccessKey: process.env.AWS_APP_SECRET_KEY,
  },
});

export function getComments(
  guideId: string,
  currentUserId?: string
): Promise<IComment[]> {
  return dynamoDb
    .query({
      TableName: process.env.DYNAMODB_COMMENTS_TABLE,
      KeyConditionExpression: 'guideId = :guideId',
      ExpressionAttributeValues: {
        ':guideId': guideId,
      },
    })
    .promise()
    .then((res) => res.Items as IComment[])
    .then((comments) =>
      comments.map((comment) => {
        return {
          ...comment,
          isMine:
            currentUserId !== undefined &&
            currentUserId === comment.githubUserId,
        };
      })
    );
}
