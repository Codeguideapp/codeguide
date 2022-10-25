import { OAuthApp } from '@octokit/oauth-app';

export const app = new OAuthApp({
  clientType: 'oauth-app',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
});
