import type { Octokit } from 'octokit';

import { IGuide } from '../types/Guide';

//import { mockFiles } from '../components/__mocks__/mockFiles';

export type FileDiff = {
  status: 'added' | 'modified' | 'deleted';
  path: string;
  oldVal: string;
  newVal: string;
};

export const getFilesDiff = async (
  guide: IGuide,
  octokit: Octokit
): Promise<FileDiff[]> => {
  //return mockFiles;

  const files: FileDiff[] = [];

  const owner = guide.owner;
  const repo = guide.repository;
  const pull_number = guide.prNum as number;

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

  const getFile = (path: string, sha?: string) => {
    return octokit
      .request('GET /repos/{owner}/{repo}/contents/{path}?ref={sha}', {
        owner,
        repo,
        path,
        sha,
      })
      .then((res) => {
        return atob(res.data.content);
      });
  };

  const filesReq = await octokit.request(
    `GET /repos/{owner}/{repo}/pulls/{pull_number}/files`,
    {
      owner,
      repo,
      pull_number,
    }
  );

  for (const file of filesReq.data) {
    const oldVal =
      file.status === 'added'
        ? ''
        : await getFile(file.filename, guide.baseSha);

    const newVal =
      file.status === 'removed'
        ? ''
        : await getFile(file.filename, guide.mergeCommitSha);

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
