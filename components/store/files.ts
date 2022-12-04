import create from 'zustand';

import { useChangesStore } from './changes';

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
    const activeChangeId = useChangesStore.getState().activeChangeId;
    if (!activeChangeId) {
      useChangesStore.getState().saveFileNode(file.path);
    }
  },
}));
