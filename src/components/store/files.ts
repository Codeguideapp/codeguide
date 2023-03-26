import * as monaco from 'monaco-editor';
import create from 'zustand';

import { Guide } from '../../types/Guide';
import { fetchWithThrow } from '../../utils/fetchWithThrow';
import { modifiedModel, originalModel } from '../../utils/monaco';
import { useStepsStore } from './steps';
import { useUserStore } from './user';

export type FileNode = {
  isFileDiff: boolean;
  isFetching: boolean;
  fetchError?: string;
  status: 'added' | 'modified' | 'deleted';
  path: string;
  oldVal: string;
  newVal: string;
  origin: Guide['fileRefs'][0]['origin'];
};

export type RepoFileRef = {
  type: 'tree' | 'blob';
  path: string;
  url: string;
  sha: string;
};

interface FilesState {
  fileRefs: Guide['fileRefs'];
  owner: Guide['owner'];
  repository: Guide['repository'];
  mergeCommitSha: Guide['mergeCommitSha'];
  baseSha: Guide['baseSha'];
  fileNodes: FileNode[];
  activeFile?: FileNode;
  undraftActiveFile: () => void;
  setActiveFileByPath: (path: string | undefined) => Promise<void>;
  setActiveFile: (file: FileNode | undefined) => void;
  setFileNodes: (refs: FileNode[]) => void;
  addGuideFile: (path: string) => void;
  storeFile: ({
    newVal,
    oldVal,
    path,
  }: {
    newVal: string;
    oldVal: string;
    path: string;
  }) => void;
  loadFile: (path: string) => Promise<FileNode>;
}

export const useFilesStore = create<FilesState>((set, get) => ({
  owner: '',
  repository: '',
  baseSha: '',
  mergeCommitSha: '',
  fileRefs: [],
  fileNodes: [],
  setActiveFile: (activeFile: FileNode | undefined) => {
    set({ activeFile });
    if (!activeFile) return;

    const extension = activeFile.path.split('.').pop() || '';

    const foundLang = monaco.languages
      .getLanguages()
      .find((lang) => lang.extensions?.includes(`.${extension}`));

    monaco.editor.setModelLanguage(modifiedModel, foundLang?.id || 'plaintext');
    monaco.editor.setModelLanguage(originalModel, foundLang?.id || 'plaintext');
  },
  addGuideFile: (path: string) => {
    set({
      fileNodes: [
        ...get().fileNodes,
        {
          path,
          isFetching: false,
          isFileDiff: false,
          newVal: '',
          oldVal: '',
          origin: 'virtual',
          status: 'modified',
        },
      ],
    });
  },
  setFileNodes: (fileNodes: FileNode[]) => {
    set({ fileNodes });
  },
  undraftActiveFile: () => {
    const activeFile = get().activeFile;

    if (!activeFile) return;

    const changes = useStepsStore.getState().steps;

    const draftChange = Object.values(changes).find(
      (c) => c.isDraft && c.path === activeFile.path
    );

    if (!draftChange) return;

    useStepsStore.getState().undraftStep(draftChange.id);
  },
  setActiveFileByPath: async (path: string | undefined) => {
    if (!path) {
      get().setActiveFile(undefined);
      return;
    }

    const fileNodes = get().fileNodes;

    const file = fileNodes.find((f) => f.path === path);

    get().setActiveFile(file);

    if (!file) {
      // make "loading file"
      set({
        activeFile: {
          isFileDiff: false,
          oldVal: '',
          newVal: '',
          path: path,
          status: 'modified',
          isFetching: true,
          origin: 'virtual',
        },
      });

      try {
        const newFile = await get().loadFile(path);
        get().setActiveFile(newFile);
      } catch (e) {
        console.error(e);
        get().setActiveFile({
          isFileDiff: false,
          oldVal: '',
          newVal: '',
          path,
          status: 'modified',
          isFetching: false,
          fetchError: 'error fetching file',
          origin: 'virtual',
        });
      }
    }

    // save new change filenode
    const activeChange = useStepsStore.getState().getActiveStep();
    if (!activeChange || activeChange.path !== path) {
      useStepsStore.getState().saveFileNode(path);
    }
  },
  storeFile: ({ newVal, oldVal, path }) => {
    const fileRef = get().fileRefs.find((f) => f.path === path);

    if (!fileRef) {
      throw new Error('File not found');
    }

    const newFile: FileNode = {
      isFileDiff: false,
      oldVal,
      newVal,
      path,
      status: 'modified',
      isFetching: false,
      origin: fileRef.origin,
    };
    get().setFileNodes([...get().fileNodes, newFile]);
  },
  loadFile: async (path: string): Promise<FileNode> => {
    const fileRef = get().fileRefs.find((f) => f.path === path);

    if (!fileRef) {
      throw new Error('File not found');
    }

    const session = await useUserStore.getState().getUserSession();

    if (fileRef.origin === 'pr') {
      const octokit = await useUserStore.getState().getOctokit();
      const getFile = (path: string, sha?: string) => {
        return octokit
          .request('GET /repos/{owner}/{repo}/contents/{path}?ref={sha}', {
            owner: get().owner,
            repo: get().repository,
            path,
            sha,
          })
          .then((res) => {
            return atob(res.data.content);
          });
      };

      const oldVal = fileRef.isAdded
        ? ''
        : await getFile(fileRef.path, get().baseSha);

      const newVal = fileRef.isDeleted
        ? ''
        : await getFile(fileRef.path, get().mergeCommitSha);

      const newFile: FileNode = {
        isFileDiff: true,
        oldVal,
        newVal,
        path: fileRef.path,
        status: 'modified',
        isFetching: false,
        origin: fileRef.origin,
      };
      get().setFileNodes([...get().fileNodes, newFile]);

      return newFile;
    } else {
      return fetchWithThrow(fileRef.url, {
        headers: session
          ? {
              Authorization: 'Bearer ' + session.user.accessToken,
            }
          : {},
      }).then((res) => {
        const content = atob(res.content);
        const newFile: FileNode = {
          isFileDiff: false,
          oldVal: content,
          newVal: content,
          path: fileRef.path,
          status: 'modified',
          isFetching: false,
          origin: fileRef.origin,
        };
        get().setFileNodes([...get().fileNodes, newFile]);

        return newFile;
      });
    }
  },
}));
