/* eslint-disable no-template-curly-in-string */
import { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'codeguide',
  frameworkVersion: '3',
  useDotenv: true,
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    environment: {
      DYNAMODB_TABLE: '${self:service}-${sls:stage}',
      CLIENT_ID: '${env:CLIENT_ID}',
      CLIENT_SECRET: '${env:CLIENT_SECRET}',
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
            ],
            Resource:
              'arn:aws:dynamodb:${aws:region}:*:table/${self:provider.environment.DYNAMODB_TABLE}',
          },
        ],
      },
    },
  },
  functions: {
    ghOauthLogin: {
      handler: 'github-oauth/login.login',
      events: [
        {
          http: {
            method: 'get',
            path: '/github/oauth/login',
          },
        },
      ],
    },
    ghOauthGrant: {
      handler: 'github-oauth/grant.grant',
      events: [
        {
          http: {
            method: 'delete',
            path: '/github/oauth/grant',
          },
        },
      ],
    },
    ghOauthCallback: {
      handler: 'github-oauth/callback.callback',
      events: [
        {
          http: {
            method: 'get',
            path: '/github/oauth/callback',
          },
        },
      ],
    },
    ghOauthCreateToken: {
      handler: 'github-oauth/createToken.createToken',
      events: [
        {
          http: {
            method: 'post',
            path: '/github/oauth/token',
          },
        },
      ],
    },
    ghOauthCheckToken: {
      handler: 'github-oauth/checkToken.checkToken',
      events: [
        {
          http: {
            method: 'get',
            path: '/github/oauth/token',
          },
        },
      ],
    },
    ghOauthResetToken: {
      handler: 'github-oauth/resetToken.resetToken',
      events: [
        {
          http: {
            method: 'patch',
            path: '/github/oauth/token',
          },
        },
      ],
    },
    ghOauthDeleteToken: {
      handler: 'github-oauth/deleteToken.deleteToken',
      events: [
        {
          http: {
            method: 'delete',
            path: '/github/oauth/token',
          },
        },
      ],
    },
    getGuide: {
      handler: 'guide/getGuide.getGuide',
      events: [
        {
          http: {
            method: 'get',
            path: '/guide/{id}',
            cors: true,
          },
        },
      ],
    },
  },
  plugins: ['serverless-plugin-typescript', 'serverless-offline'],
  custom: {
    'serverless-offline': { httpPort: 4000 },
  },
};

module.exports = serverlessConfiguration;
