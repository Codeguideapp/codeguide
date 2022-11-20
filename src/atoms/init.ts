import { atom } from 'jotai';

import { getFiles } from '../api/api';
import { backendApi } from '../config';
import { checkToken, exchangeCodeForToken } from '../login';
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
  const searchParams = new URLSearchParams(document.location.search);

  const params: any = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  if (params.code) {
    await exchangeCodeForToken(params.code);
  } else {
    await checkToken();
  }

  try {
    const guideId = document.location.pathname.split('/')[1];
    const isEdit = document.location.pathname.split('/')[2] === 'edit';

    set(isEditAtom, isEdit);
    const guide = await fetchWithThrow(`${backendApi}/guide/${guideId}`);

    set(guideAtom, guide);
  } catch (err: any) {
    return set(repoApiStatusAtom, {
      errorStatus: err?.status || 500,
      shouldTryLogin: false,
      isLoading: false,
    });
  }

  try {
    const guide = get(guideAtom);
    const repoFiles = await fetchWithThrow(
      `https://api.github.com/repos/${guide.owner}/${guide.repository}/git/trees/HEAD?recursive=1`,
      {
        headers: localStorage.getItem('token')
          ? {
              Authorization: 'Bearer ' + localStorage.getItem('token'),
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
    if (!localStorage.getItem('token')) {
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
