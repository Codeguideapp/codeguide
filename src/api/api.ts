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
  //return [mockFiles[1]];
  const files: ApiFile[] = [];

  let owner = '';
  let repo = '';
  let pull_number = '';

  const paths = document.location.pathname.split('/');
  if (paths.length > 4) {
    owner = paths[1];
    repo = paths[2];
    pull_number = paths[4];
  } else {
    return mockFiles;
  }

  //const owner = 'stoplightio';
  //const repo = 'elements';
  //const pull_number = 153;
  //const pull_number = 1693;

  // const owner = 'webiny';
  // const repo = 'webiny-js';
  // const pull_number = 2402;

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
    ).then((r) => {
      if (r.status === 404) {
        return '';
      }
      return r.text();
    });

    //console.log(file);
    const newVal = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${
        prReq.data.merge_commit_sha
      }/${encodeURIComponent(file.filename)}`
    ).then((r) => {
      if (r.status === 404) {
        return '';
      }
      return r.text();
    });

    files.push({
      path: file.filename,
      status: file.status,
      oldVal,
      newVal,
    });
  }

  return files;
};
