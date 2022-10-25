import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

import { corsHeaders } from '../headers';

const dynamoDb = new DynamoDB.DocumentClient();

export const getGuide = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    return {
      statusCode: error.statusCode || 501,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
      },
      body: "Couldn't fetch the guide.",
    };
  }
};
