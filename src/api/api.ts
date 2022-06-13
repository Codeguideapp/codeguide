import { Octokit } from 'octokit';

import { mockFiles } from '../__mocks__/mockFiles';

export type ApiFile = {
  status: 'added' | 'modified' | 'deleted';
  path: string;
  oldVal: string;
  newVal: string;
};

export const getFile = async (path: string) => {
  // note: this can be invoked as user types, so it needs a caching layer
  const files = await getFiles(0);
  return files.find((f) => f.path === path);
};

const octokit = new Octokit({
  auth: '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',
});

export const getFiles = async (pr: number): Promise<ApiFile[]> => {
  return mockFiles;
  const files: ApiFile[] = [];

  //const owner = 'stoplightio';
  //const repo = 'elements';
  //const pull_number = 153;
  //const pull_number = 1693;

  const owner = 'webiny';
  const repo = 'webiny-js';
  const pull_number = 2402;

  const prReq = await octokit.request(
    `GET /repos/${owner}/${repo}/pulls/${pull_number}`,
    {
      owner,
      repo,
      pull_number,
    }
  );
  const baseSha = prReq.data.base.sha;

  const filesReq = await octokit.request(
    `GET /repos/${owner}/${repo}/pulls/${pull_number}/files`,
    {
      owner,
      repo,
      pull_number,
    }
  );

  for (const file of filesReq.data) {
    const oldVal = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${baseSha}/${encodeURIComponent(
        file.filename
      )}`
    ).then((r) => r.text());

    //console.log(file);
    const newVal = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${
        prReq.data.merge_commit_sha
      }/${encodeURIComponent(file.filename)}`
    ).then((r) => r.text());

    files.push({
      path: file.filename,
      status: file.status,
      oldVal,
      newVal,
    });
  }

  return files;
};
