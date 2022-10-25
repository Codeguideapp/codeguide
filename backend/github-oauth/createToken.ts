import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { app } from './oauthApp';

export const createToken = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body);

  const { authentication } = await app.createToken({
    state: body.state,
    code: body.code,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      token: authentication.token,
      scopes: authentication.scopes,
    }),
  };
};
