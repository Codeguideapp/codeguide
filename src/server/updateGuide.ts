import { Guide, GuideZod } from '../types/Guide';
import { dynamoDb } from './dynamoDb';

export async function updateGuide(
  guideId: string,
  property: keyof Guide,
  newValue: unknown
) {
  const key = GuideZod.shape[property];
  if (!key) {
    throw new Error(`Invalid property: ${property}`);
  }

  try {
    const parsedValue = key.parse(newValue);
    const params = {
      TableName: process.env.DYNAMODB_GUIDES_TABLE,
      Key: { id: guideId },
      UpdateExpression: `SET #property = :newValue`,
      ExpressionAttributeNames: {
        '#property': property,
      },
      ExpressionAttributeValues: {
        ':newValue': parsedValue,
      },
      ReturnValues: 'ALL_NEW',
    };

    const result = await dynamoDb.update(params).promise();
    return result.Attributes;
  } catch (error) {
    console.error(`Error updating guide ${guideId}:`, error);
    throw error;
  }
}
