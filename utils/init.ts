import { getSession } from 'next-auth/react';
import { Octokit } from 'octokit';

import { useFilesStore } from '../components/store/files';
import { Guide, useGuideStore } from '../components/store/guide';
import { fetchWithThrow } from './fetchWithThrow';
import { getFilesDiff } from './getFilesDiff';

export type RepoApiStatus = {
  isLoading: boolean;
  shouldTryLogin: boolean;
  errorStatus: number;
};

export async function init(): Promise<RepoApiStatus> {
  let guide: Guide | undefined;

  try {
    const guideId = document.location.pathname.split('/')[1];
    //const isEdit = document.location.pathname.split('/')[2] === 'edit';

    guide = (await fetchWithThrow(`/api/guide/${guideId}`)) as Guide;
    useGuideStore.setState(guide);
  } catch (err: any) {
    return {
      errorStatus: err?.status || 500,
      shouldTryLogin: false,
      isLoading: false,
    };
  }

  const session = await getSession();

  try {
    const octokit = new Octokit({
      auth: session?.user.accessToken,
    });

    const repoFiles = await octokit.request(
      'GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1',
      {
        sha: 'HEAD', // todo
        owner: guide.owner,
        repo: guide.repository,
      }
    );

    useFilesStore.getState().setAllRepoFileRefs(repoFiles.data.tree);
    //set(allRepoFileRefsAtom, repoFiles.data.tree);

    const apiFiles = await getFilesDiff(guide, octokit);
    // set(
    //   fileNodesAtom,
    //   apiFiles.map((file) => ({ ...file, isFileDiff: true, isFetching: false }))
    // );
    useFilesStore.getState().setFileNodes(
      apiFiles.map((file) => ({
        ...file,
        isFileDiff: true,
        isFetching: false,
      }))
    );

    return {
      errorStatus: 0,
      shouldTryLogin: false,
      isLoading: false,
    };
  } catch (err: any) {
    if (!session) {
      return {
        errorStatus: err?.status || 0,
        shouldTryLogin: true,
        isLoading: false,
      };
    } else {
      console.log(err);
      return {
        errorStatus: err?.status || 0,
        shouldTryLogin: false,
        isLoading: false,
      };
    }
  }
}
