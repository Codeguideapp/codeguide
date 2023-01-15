import { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from 'octokit';

import { getUserSession } from '../../server/getUserSession';
import { saveGuide } from '../../server/saveGuide';
import { IGuide } from '../../types/Guide';
import { generateGuideId } from '../../utils/generateGuideId';
import { parseGithubUrl } from '../../utils/parseGithubUrl';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { url } = req.query;
  try {
    const user = await getUserSession(req, res);
    const { owner, pullRequest, repository } = parseGithubUrl(url as string);

    const octokit = new Octokit({
      auth: user.accessToken,
    });

    if (pullRequest === null) {
      const repoInfo = await octokit.request('GET /repos/{owner}/{repo}', {
        owner: owner,
        repo: repository,
      });

      const mainCommit = await octokit.request(
        'GET /repos/{owner}/{repo}/commits/{mainCommit}',
        {
          owner: owner,
          repo: repository,
          mainCommit: repoInfo.data.default_branch,
        }
      );

      const sha = mainCommit.data.sha;

      if (!sha) {
        throw new Error('Error getting the main commit');
      }

      const guide: IGuide = {
        baseSha: mainCommit.data.sha,
        canEdit: [user.email],
        createdBy: user.email,
        id: generateGuideId(),
        owner,
        repository,
        type: 'browse',
      };

      await saveGuide(guide);

      return res.status(200).json({ guide });
    }
  } catch (error) {
    if (error instanceof Error && error.message) {
      return res.status(400).json({ message: error.message });
    }
  }

  // do something with the url here
  res.status(200).json({ message: 'URL received' });
}
