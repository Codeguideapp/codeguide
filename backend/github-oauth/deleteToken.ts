import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { app } from './oauthApp';

export const deleteToken = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const token = (event.headers.authorization || '').substr('token '.length);

  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: '"Authorization" header is required',
      }),
    };
  }

  try {
    const res = app.deleteToken({ token });

    return {
      statusCode: 204,
      body: JSON.stringify(res),
    };
  } catch (error) {
    if (error.status === 404) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid authentication',
        }),
      };
    }

    throw error;
  }
};
