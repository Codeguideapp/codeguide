import { GuideZod } from '../types/Guide';
import { dynamoDb } from './dynamoDb';

export function saveGuide(guide: unknown) {
  const guideParsed = GuideZod.parse(guide);

  return dynamoDb
    .put({
      TableName: process.env.DYNAMODB_GUIDES_TABLE,
      Item: guideParsed,
    })
    .promise();
}
