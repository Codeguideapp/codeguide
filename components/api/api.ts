import type { Octokit } from 'octokit';

import { mockFiles } from '../__mocks__/mockFiles';
import { Guide } from '../atoms/guide';

export type ApiFile = {
  status: 'added' | 'modified' | 'deleted';
  path: string;
  oldVal: string;
  newVal: string;
};

export const getFiles = async (
  guide: Guide,
  octokit: Octokit
): Promise<ApiFile[]> => {
  return mockFiles;

  const files: ApiFile[] = [];

  let owner = guide.owner;
  let repo = guide.repository;
  let pull_number = 1;

  // const prReq = await octokit.request(
  //   `GET /repos/{owner}/{repo}/pulls/{pull_number}`,
  //   {
  //     owner,
  //     repo,
  //     pull_number,
  //   }
  // );
  // const baseSha = prReq.data.base.sha;
  // console.log({ prReq });

  const filesReq = await octokit.request(
    `GET /repos/{owner}/{repo}/pulls/{pull_number}/files`,
    {
      owner,
      repo,
      pull_number,
    }
  );

  for (const file of filesReq.data) {
    const oldVal = await octokit
      .request('GET /repos/{owner}/{repo}/contents/{path}?ref={baseSha}', {
        owner,
        repo,
        path: file.filename,
        baseSha: guide.baseSha,
      })
      .then((res) => {
        return atob(res.data.content);
      });

    const newVal = await octokit
      .request(
        'GET /repos/{owner}/{repo}/contents/{path}?ref={mergeCommitSha}',
        {
          owner,
          repo,
          path: file.filename,
          mergeCommitSha: guide.mergeCommitSha,
        }
      )
      .then((res) => {
        return atob(res.data.content);
      });

    const status =
      file.status === 'added'
        ? 'added'
        : file.status === 'removed'
        ? 'deleted'
        : 'modified';

    files.push({
      path: file.filename,
      status,
      oldVal,
      newVal,
    });
  }

  return files;
};
