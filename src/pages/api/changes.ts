import type { NextApiRequest, NextApiResponse } from 'next';

import { deleteChanges } from '../../server/deleteChanges';
import { getGuideInfo } from '../../server/getGuideInfo';
import { getUserSession } from '../../server/getUserSession';
import { saveChanges } from '../../server/saveChanges';

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
    const guide = await getGuideInfo(guideId);

    if (req.method === 'POST') {
      const { statusCode, json } = await saveChanges({
        email: user.email,
        guide,
        changesBody: req.body,
      });

      return res.status(statusCode).json(json);
    } else if (req.method === 'DELETE') {
      const { statusCode, json } = await deleteChanges({
        email: user.email,
        guide,
        changeIds: req.body.changeIds,
      });

      return res.status(statusCode).json(json);
    }
  } catch (error: any) {
    console.log(error);
    return res.status(error?.statusCode || 500).send("Couldn't save changes.");
  }
}
