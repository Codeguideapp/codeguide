import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { app } from './oauthApp';

export const login = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { authentication } = await app.createToken({
    state: event.queryStringParameters.state,
    code: event.queryStringParameters.code,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      token: authentication.token,
    }),
  };
};
