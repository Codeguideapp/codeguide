import { getSession } from 'next-auth/react';
import { Octokit } from 'octokit';

import { Change, useChangesStore } from '../components/store/changes';
import { useFilesStore } from '../components/store/files';
import { useGuideStore } from '../components/store/guide';
import { IGuide } from '../types/Guide';
import { fetchWithThrow } from './fetchWithThrow';
import { getFilesDiff } from './getFilesDiff';

export type RepoApiStatus = {
  isLoading: boolean;
  shouldTryLogin: boolean;
  errorStatus: number;
};

export async function init(): Promise<RepoApiStatus> {
  let initChanges: Change[] = [];
  try {
    const guideId = document.location.pathname.split('/')[1];
    //const isEdit = document.location.pathname.split('/')[2] === 'edit';

    const res = (await fetchWithThrow(`/api/guide/${guideId}`)) as {
      guide: IGuide;
      changes: Change[];
    };

    initChanges = res.changes;
    useGuideStore.setState(res.guide);
  } catch (err: any) {
    console.error(err);

    return {
      errorStatus: err?.status || 500,
      shouldTryLogin: false,
      isLoading: false,
    };
  }

  const session = await getSession();
  const guide = useGuideStore.getState();

  try {
    const octokit = new Octokit({
      auth: session?.user.accessToken,
    });

    const repoFiles = await octokit.request(
      'GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1',
      {
        sha: guide.baseSha,
        owner: guide.owner,
        repo: guide.repository,
      }
    );

    useFilesStore.getState().setAllRepoFileRefs(repoFiles.data.tree);

    const apiFiles = await getFilesDiff(guide, octokit);

    useFilesStore.getState().setFileNodes(
      apiFiles.map((file) => ({
        ...file,
        isFileDiff: true,
        isFetching: false,
      }))
    );

    useChangesStore.getState().storeChangesFromServer(initChanges);

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
