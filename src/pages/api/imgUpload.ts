import S3 from 'aws-sdk/clients/s3';
import { nanoid } from 'nanoid';
import { NextApiRequest, NextApiResponse } from 'next';

const s3 = new S3({
  region: process.env.AWS_APP_REGION,
  accessKeyId: process.env.AWS_APP_ACCESS_KEY,
  secretAccessKey: process.env.AWS_APP_SECRET_KEY,
  signatureVersion: 'v4',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { type } = req.body;
    const path = nanoid();

    const url = await s3.getSignedUrlPromise('putObject', {
      Bucket: process.env.AWS_APP_UPLOAD_BUCKET,
      Key: path,
      Expires: 600,
      ContentType: type,
    });

    res.status(200).json({
      url,
      path,
      publicUrl: `https://s3.amazonaws.com/${process.env.AWS_APP_UPLOAD_BUCKET}/${path}`,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
}
