import * as monaco from 'monaco-editor';
import create from 'zustand';

import { fetchWithThrow } from '../../utils/fetchWithThrow';
import { useChangesStore } from './changes';
import { useGuideStore } from './guide';
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
  fileNodes: FileNode[];
  activeFile?: FileNode;
  activeFileModModel: monaco.editor.ITextModel;
  activeFileOrgModel: monaco.editor.ITextModel;
  undraftActiveFile: () => void;
  setActiveFileByPath: (path: string | undefined) => Promise<void>;
  setActiveFile: (file: FileNode) => void;
  setFileNodes: (refs: FileNode[]) => void;
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
  activeFileModModel: monaco.editor.createModel('', 'typescript'),
  activeFileOrgModel: monaco.editor.createModel('', 'typescript'),
  fileNodes: [],
  getActiveFileModifiedModel: () => {
    return monaco.editor.createModel('', 'typescript');
  },
  setActiveFile: (activeFile: FileNode) => {
    get().activeFileModModel.dispose();
    get().activeFileOrgModel.dispose();

    set({
      activeFile,
      activeFileModModel: monaco.editor.createModel(
        '',
        undefined,
        monaco.Uri.file(activeFile.path)
      ),
      activeFileOrgModel: monaco.editor.createModel(
        '',
        undefined,
        monaco.Uri.file(activeFile.path)
      ),
    });
  },
  setFileNodes: (fileNodes: FileNode[]) => {
    set({ fileNodes });
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
  setActiveFileByPath: async (path: string | undefined) => {
    if (!path) {
      set({ activeFile: undefined });
      return;
    }

    const fileNodes = get().fileNodes;

    const file = fileNodes.find((f) => f.path === path);

    set({ activeFile: file });

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
        },
      });

      try {
        const newFile = await get().loadFile(path);
        set({ activeFile: newFile });
      } catch (e) {
        set({
          activeFile: {
            isFileDiff: false,
            oldVal: '',
            newVal: '',
            path,
            status: 'modified',
            isFetching: false,
            fetchError: 'error fetching file',
          },
        });
      }
    }

    // save new change filenode
    const activeChange = useChangesStore.getState().getActiveChange();
    if (!activeChange || activeChange.path !== path) {
      useChangesStore.getState().saveFileNode(path);
    }
  },
  storeFile: ({ newVal, oldVal, path }) => {
    const newFile: FileNode = {
      isFileDiff: false,
      oldVal,
      newVal,
      path,
      status: 'modified',
      isFetching: false,
    };
    get().setFileNodes([...get().fileNodes, newFile]);
  },
  loadFile: async (path: string): Promise<FileNode> => {
    const repoFileRef = useGuideStore
      .getState()
      .fileRefs.find((f) => f.path === path);

    const changedFileRef = useGuideStore
      .getState()
      .changedFileRefs.find((f) => f.path === path);

    if (!repoFileRef && !changedFileRef) {
      throw new Error('File not found');
    }

    const session = await useUserStore.getState().getUserSession();

    if (changedFileRef) {
      const octokit = await useUserStore.getState().getOctokit();
      const getFile = (path: string, sha?: string) => {
        return octokit
          .request('GET /repos/{owner}/{repo}/contents/{path}?ref={sha}', {
            owner: guide.owner,
            repo: guide.repository,
            path,
            sha,
          })
          .then((res) => {
            return atob(res.data.content);
          });
      };

      const guide = useGuideStore.getState();

      const oldVal =
        changedFileRef.status === 'added'
          ? ''
          : await getFile(changedFileRef.path, guide.baseSha);

      const newVal =
        changedFileRef.status === 'deleted'
          ? ''
          : await getFile(changedFileRef.path, guide.mergeCommitSha);

      const newFile: FileNode = {
        isFileDiff: true,
        oldVal,
        newVal,
        path: changedFileRef.path,
        status: changedFileRef.status,
        isFetching: false,
      };
      get().setFileNodes([...get().fileNodes, newFile]);

      return newFile;
    } else if (repoFileRef) {
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
    } else {
      throw new Error('File not found');
    }
  },
}));
