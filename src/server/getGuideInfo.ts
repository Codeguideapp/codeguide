import { Guide } from '../types/Guide';
import { dynamoDb } from './dynamoDb';

export function getGuideInfo(id: string): Promise<Guide> {
  return dynamoDb
    .get({
      TableName: process.env.DYNAMODB_GUIDES_TABLE,
      Key: {
        id,
      },
    })
    .promise()
    .then((result) => result.Item as Guide);
}
