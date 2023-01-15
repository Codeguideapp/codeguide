import { IGuide } from '../types/Guide';
import { dynamoDb } from './dynamoDb';

export function getGuide(id: string): Promise<IGuide> {
  return dynamoDb
    .get({
      TableName: process.env.DYNAMODB_GUIDES_TABLE,
      Key: {
        id,
      },
    })
    .promise()
    .then((result) => result.Item as IGuide);
}
