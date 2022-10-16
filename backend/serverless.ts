/* eslint-disable no-template-curly-in-string */
import { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'codeguide',
  frameworkVersion: '3',
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    environment: {
      DYNAMODB_TABLE: '${self:service}-${sls:stage}',
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
  },
  plugins: ['serverless-plugin-typescript'],
};

module.exports = serverlessConfiguration;
