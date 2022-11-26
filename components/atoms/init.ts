import { atom } from 'jotai';
import { getSession } from 'next-auth/react';

import { getFiles } from '../api/api';
import { fetchWithThrow } from '../utils/fetchWithThrow';
import { allRepoFileRefsAtom, fileNodesAtom } from './files';
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

  console.log(session);
  try {
    const guide = get(guideAtom);
    const repoFiles = await fetchWithThrow(
      `https://api.github.com/repos/${guide.owner}/${guide.repository}/git/trees/HEAD?recursive=1`,
      {
        headers: session
          ? {
              Authorization: 'Bearer ' + session.user.accessToken,
            }
          : {},
      }
    );
    set(allRepoFileRefsAtom, repoFiles.tree);

    const apiFiles = await getFiles(0);
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
