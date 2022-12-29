import create from 'zustand';

import { fetchWithThrow } from '../../utils/fetchWithThrow';
import { useChangesStore } from './changes';
import { useUserStore } from './user';

export type FileNode = {
  isFileDiff: boolean;
  isFetching: boolean;
  fetchError?: string;
  status: 'added' | 'modified' | 'deleted';
  path: string;
  oldVal: string;
  newVal: string;
};

export type RepoFileRef = {
  type: 'tree' | 'blob';
  path: string;
  url: string;
  sha: string;
};

interface FilesState {
  allRepoFileRefs: RepoFileRef[];
  fileNodes: FileNode[];
  activeFile?: FileNode;
  undraftActiveFile: () => void;
  setActiveFileByPath: (path: string | undefined) => void;
  setActiveFile: (file: FileNode) => void;
  setFileNodes: (refs: FileNode[]) => void;
  setAllRepoFileRefs: (refs: RepoFileRef[]) => void;
  loadFile: (path: string) => Promise<FileNode>;
}

export const useFilesStore = create<FilesState>((set, get) => ({
  allRepoFileRefs: [],
  fileNodes: [],
  setActiveFile: (activeFile: FileNode) => {
    set({ activeFile });
  },
  setFileNodes: (fileNodes: FileNode[]) => {
    set({ fileNodes });
  },
  setAllRepoFileRefs: (allRepoFileRefs: RepoFileRef[]) => {
    set({ allRepoFileRefs });
  },
  undraftActiveFile: () => {
    const activeFile = get().activeFile;

    if (!activeFile) return;

    const changes = useChangesStore.getState().changes;

    const draftChange = Object.values(changes).find(
      (c) => c.isDraft && c.path === activeFile.path
    );

    if (!draftChange) return;

    useChangesStore.getState().undraftChange(draftChange.id);
  },
  setActiveFileByPath: (path: string | undefined) => {
    const fileNodes = get().fileNodes;

    const file = fileNodes.find((f) => f.path === path);

    set({ activeFile: file });

    if (!file) return;

    // save new change filenode
    const activeChange = useChangesStore.getState().getActiveChange();
    if (!activeChange || activeChange.path !== file.path) {
      useChangesStore.getState().saveFileNode(file.path);
    }
  },
  loadFile: async (path: string): Promise<FileNode> => {
    const repoFileRef = get().allRepoFileRefs.find((f) => f.path === path);

    if (!repoFileRef) {
      throw new Error('File not found');
    }

    const session = await useUserStore.getState().getUserSession();
    return fetchWithThrow(repoFileRef.url, {
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
        path: repoFileRef.path,
        status: 'modified',
        isFetching: false,
      };
      get().setFileNodes([...get().fileNodes, newFile]);

      return newFile;
    });
  },
}));
