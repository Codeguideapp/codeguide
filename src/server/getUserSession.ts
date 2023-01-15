import { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth';

import { authOptions } from '../pages/api/auth/[...nextauth]';

export async function getUserSession(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (session) {
    return session.user as {
      email: string;
      id: string;
      accessToken: string;
      name?: string;
      image?: string;
    };
  } else {
    throw new Error('Not authenticated');
  }
}
