import type { NextApiRequest, NextApiResponse } from 'next';

import { getChanges } from '../../../server/getChanges';
import { getComments } from '../../../server/getComments';
import { getGuide } from '../../../server/getGuide';
import { getUserSession } from '../../../server/getUserSession';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    const guideId = req.query.id;
    if (typeof guideId !== 'string') {
      throw new Error('Invalid id');
    }

    const user = await getUserSession(req, res).catch(() => null);
    const guide = await getGuide(guideId);
    const changes = await getChanges(guideId);
    const comments = await getComments(guideId, user?.id);

    if (!guide) {
      return res.status(404).json({});
    }

    return res.status(200).json({ guide, changes, comments });
  } catch (error: any) {
    console.log(error);

    return res
      .status(error?.statusCode || 501)
      .send("Couldn't fetch the guide.");
  }
}
