import { atom } from 'jotai';
import { getSession } from 'next-auth/react';
import { Octokit } from 'octokit';

import { fetchWithThrow } from '../utils/fetchWithThrow';
import { allRepoFileRefsAtom, fileNodesAtom } from './files';
import { getFilesDiff } from './getFilesDiff';
import { guideAtom, isEditAtom } from './guide';

export const repoApiStatusAtom = atom<{
  isLoading: boolean;
  shouldTryLogin: boolean;
  errorStatus: number;
}>({
  isLoading: true,
  shouldTryLogin: false,
  errorStatus: 0,
});

export const initAtom = atom(null, async (get, set) => {
  try {
    const guideId = document.location.pathname.split('/')[1];
    const isEdit = document.location.pathname.split('/')[2] === 'edit';

    set(isEditAtom, isEdit);
    const guide = await fetchWithThrow(`/api/guide/${guideId}`);

    set(guideAtom, guide);
  } catch (err: any) {
    return set(repoApiStatusAtom, {
      errorStatus: err?.status || 500,
      shouldTryLogin: false,
      isLoading: false,
    });
  }

  const session = await getSession();

  try {
    const octokit = new Octokit({
      auth: session?.user.accessToken,
    });

    const guide = get(guideAtom);

    const repoFiles = await octokit.request(
      'GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1',
      {
        sha: 'HEAD', // todo
        owner: guide.owner,
        repo: guide.repository,
      }
    );

    set(allRepoFileRefsAtom, repoFiles.data.tree);

    const apiFiles = await getFilesDiff(guide, octokit);
    set(
      fileNodesAtom,
      apiFiles.map((file) => ({ ...file, isFileDiff: true, isFetching: false }))
    );

    set(repoApiStatusAtom, {
      errorStatus: 0,
      shouldTryLogin: false,
      isLoading: false,
    });
  } catch (err: any) {
    if (!session) {
      set(repoApiStatusAtom, {
        errorStatus: err?.status || 0,
        shouldTryLogin: true,
        isLoading: false,
      });
    } else {
      set(repoApiStatusAtom, {
        errorStatus: err?.status || 0,
        shouldTryLogin: false,
        isLoading: false,
      });
    }
    console.log(err);
  }
});
