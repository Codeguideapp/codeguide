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

export const getGuide = async (id: string): Promise<any> => {
  return fetch(
    `https://hacfl33zzl.execute-api.us-east-1.amazonaws.com/dev/guide/${id}`
  )
    .then((response) => {
      if (!response.ok) throw Error(response.statusText);
      return response;
    })
    .then((response) => response.json());
};

export const getFiles = async (pr: number): Promise<ApiFile[]> => {
  return mockFiles;
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
    alert(
      'No pull request found. Open URL in this: format:\n\nhttps://app.gitline.io/org/reponame/pull/123'
    );
    return [];
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
    const oldVal = await octokit
      .request('GET /repos/{owner}/{repo}/contents/{path}?ref=' + baseSha, {
        owner,
        repo,
        path: file.filename,
      })
      .then((res) => {
        return atob(res.data.content);
      });

    const newVal = await octokit
      .request(
        'GET /repos/{owner}/{repo}/contents/{path}?ref=' +
          prReq.data.merge_commit_sha,
        {
          owner,
          repo,
          path: file.filename,
        }
      )
      .then((res) => {
        return atob(res.data.content);
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
