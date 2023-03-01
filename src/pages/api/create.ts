import { customAlphabet } from 'nanoid';
import { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from 'octokit';

import { getUserSession } from '../../server/getUserSession';
import { saveGuide } from '../../server/saveGuide';
import { IGuide } from '../../types/Guide';
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

    const repoInfo = await octokit.request('GET /repos/{owner}/{repo}', {
      owner: owner,
      repo: repository,
    });

    let mergeCommitSha;
    let baseSha;
    const changedFileRefs: any[] = [];

    if (pullRequest) {
      const prReq = await octokit.request(
        `GET /repos/{owner}/{repo}/pulls/{pullRequest}`,
        {
          owner,
          repo: repository,
          pullRequest,
        }
      );

      const prChangedFiles = await octokit.request(
        `GET /repos/{owner}/{repo}/pulls/{pullRequest}/files`,
        {
          owner,
          repo: repository,
          pullRequest,
        }
      );

      for (const file of prChangedFiles.data) {
        changedFileRefs.push(file);
      }

      baseSha = prReq.data.base.sha;
      mergeCommitSha = prReq.data.merge_commit_sha;
    } else {
      const mainCommit = await octokit.request(
        'GET /repos/{owner}/{repo}/commits/{mainCommit}',
        {
          owner: owner,
          repo: repository,
          mainCommit: repoInfo.data.default_branch,
        }
      );

      baseSha = mainCommit.data.sha;
    }

    if (!baseSha) {
      throw new Error('Error getting the main commit');
    }

    const repoFiles = await octokit.request(
      'GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1',
      {
        sha: baseSha,
        owner: owner,
        repo: repository,
      }
    );

    type FileRef = IGuide['fileRefs'][number];
    const guide: IGuide = {
      prNum: pullRequest || undefined,
      mergeCommitSha,
      baseSha,
      canEdit: [user.email],
      createdBy: user.email,
      id: generateGuideId(),
      owner,
      repository,
      type: pullRequest ? 'diff' : 'browse',
      fileRefs: [
        ...repoFiles.data.tree
          .filter(
            (repoFile: FileRef) =>
              !changedFileRefs.find((f) => f.filename === repoFile.path)
          )
          .map(
            (file: FileRef): FileRef => ({
              path: file.path,
              sha: file.sha,
              url: file.url,
              type: file.type,
              origin: 'commit',
            })
          ),
        ...changedFileRefs.map(
          (file): FileRef => ({
            path: file.filename,
            sha: file.sha,
            url: file.blob_url,
            type: 'blob',
            origin: 'pr',
            isAdded: file.status === 'added',
            isDeleted: file.status === 'removed',
          })
        ),
      ],
      privateRepoWhenCreated: repoInfo.data.private,
      createdAt: Date.now(),
    };

    await saveGuide(guide);

    // redirect to the guide
    return res.status(303).redirect(`/${guide.id}/edit`);
  } catch (error) {
    if (error instanceof Error && error.message) {
      return res.status(400).json({ message: error.message });
    }
  }
}

function generateGuideId() {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
  const nanoid = customAlphabet(alphabet, 9);
  return nanoid();
}
