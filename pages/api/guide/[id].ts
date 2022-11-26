import { DynamoDB } from 'aws-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';

const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.AWS_APP_REGION,
  credentials: {
    accessKeyId: process.env.AWS_APP_ACCESS_KEY,
    secretAccessKey: process.env.AWS_APP_SECRET_KEY,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const params = {
    TableName: process.env.CODEGUIDE_DYNAMODB_TABLE,
    Key: {
      id: req.query.id,
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({});
    }

    return res.status(200).json(result.Item);
  } catch (error: any) {
    console.log(error);

    return res
      .status(error?.statusCode || 501)
      .send("Couldn't fetch the guide.");
  }
}
