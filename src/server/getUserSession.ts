import { NextApiRequest, NextApiResponse } from 'next';

import { getServerAuthSession } from './auth';

export async function getUserSession(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerAuthSession({ req, res });

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
