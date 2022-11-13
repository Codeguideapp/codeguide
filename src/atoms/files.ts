import { atom } from 'jotai';

import {
  changesAtom,
  highlightChangeIdAtom,
  undraftChangeAtom,
} from './changes';
import { saveFileNodeAtom } from './saveDeltaAtom';

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

export const allRepoFileRefsAtom = atom<RepoFileRef[]>([]);
export const fileNodesAtom = atom<FileNode[]>([]);

export const activeFileAtom = atom<FileNode | undefined>(undefined);

export const unsavedFilePathsAtom = atom((get) => {
  const changes = get(changesAtom);
  return Object.values(changes)
    .filter((c) => c.isDraft)
    .map((c) => c.path);
});

export const undraftActiveFileAtom = atom(null, (get, set) => {
  const activeFile = get(activeFileAtom);

  if (!activeFile) return;

  const changes = get(changesAtom);

  const draftChange = Object.values(changes).find(
    (c) => c.isDraft && c.path === activeFile.path
  );

  if (!draftChange) return;

  set(undraftChangeAtom, draftChange.id);
});

export const setActiveFileByPathAtom = atom(
  null,
  (get, set, path: string | undefined) => {
    const fileNodes = get(fileNodesAtom);

    const file = fileNodes.find((f) => f.path === path);

    set(activeFileAtom, file);

    if (!file) return;

    // save new change filenode
    const highlightChangeId = get(highlightChangeIdAtom);
    if (!highlightChangeId) {
      set(saveFileNodeAtom, file.path);
    }
  }
);
