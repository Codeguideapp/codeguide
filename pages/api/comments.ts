import type { NextApiRequest, NextApiResponse } from 'next';

import { deleteComments } from '../../server/deleteComments';
import { getGuide } from '../../server/getGuide';
import { getUserSession } from '../../server/getUserSession';
import { saveComments } from '../../server/saveComment';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const guideId = req.query.guideId;

  if (typeof guideId !== 'string') {
    return res.status(400).json({ error: 'guideId is required' });
  }

  try {
    const user = await getUserSession(req, res);
    const guide = await getGuide(guideId);

    if (req.method === 'POST') {
      const { statusCode, json } = await saveComments({
        email: user.email,
        guide,
        comments: req.body.comments,
      });

      return res.status(statusCode).json(json);
    } else if (req.method === 'DELETE') {
      const { statusCode, json } = await deleteComments({
        email: user.email,
        guide,
        commentIds: req.body.commentIds,
      });

      return res.status(statusCode).json(json);
    }
  } catch (error: any) {
    console.log(error);
    return res.status(error?.statusCode || 500).send('Error saving comment.');
  }
}
