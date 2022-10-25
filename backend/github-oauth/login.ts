import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { app } from './oauthApp';

export const login = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { url } = await app.getWebFlowAuthorizationUrl({
    state: event.queryStringParameters.state,
    scopes:
      typeof event.queryStringParameters.scopes === 'string'
        ? event.queryStringParameters.scopes.split(',')
        : [],
    allowSignup:
      event.queryStringParameters.allowSignup === 'true' ? true : false,
    redirectUrl: event.queryStringParameters.redirectUrl,
  });

  return {
    statusCode: 302,
    headers: {
      Location: url,
    },
    body: '',
  };
};
