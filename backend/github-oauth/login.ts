import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const login = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'bla',
        input: event,
      },
      null,
      2
    ),
  };
};
