import { atom } from 'jotai';

import { getFiles } from '../api/api';
import { backendApi } from '../config';
import { checkToken, exchangeCodeForToken } from '../login';
import { fetchWithThrow } from '../utils/fetchWithThrow';
import { fileChangesAtom, repoFilesAtom } from './files';
import { guideAtom } from './guide';

export const repoApiStatusAtom = atom<{
  isLoading: boolean;
  shouldTryLogin: boolean;
  isError: boolean;
}>({
  isLoading: true,
  shouldTryLogin: false,
  isError: false,
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
    const guide = await fetchWithThrow(`${backendApi}/guide/${guideId}`);

    set(guideAtom, guide);
  } catch (err) {
    // todo: new error prop
    return set(repoApiStatusAtom, {
      isError: true,
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
    set(
      repoFilesAtom,
      repoFiles.tree.map((file: any) => ({
        path: file.path,
        url: file.url,
      }))
    );

    const apiFiles = await getFiles(0);
    set(fileChangesAtom, apiFiles);

    set(repoApiStatusAtom, {
      isError: false,
      shouldTryLogin: false,
      isLoading: false,
    });
  } catch (err) {
    if (!localStorage.getItem('token')) {
      set(repoApiStatusAtom, {
        isError: true,
        shouldTryLogin: true,
        isLoading: false,
      });
    } else {
      set(repoApiStatusAtom, {
        isError: true,
        shouldTryLogin: false,
        isLoading: false,
      });
    }
    console.log(err);
  }
});
