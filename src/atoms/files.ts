import { atom } from 'jotai';
import Delta from 'quill-delta';

import {
  changesAtom,
  changesOrderAtom,
  highlightChangeIdAtom,
  undraftChangeAtom,
} from './changes';
import { saveDeltaAtom, saveFileNodeAtom } from './saveDeltaAtom';

export type File = {
  status: 'added' | 'modified' | 'deleted';
  path: string;
  oldVal: string;
  newVal: string;
};

export type FileBrowse = {
  path: string;
  url: string;
};

export const repoFilesAtom = atom<FileBrowse[]>([]);
export const fileChangesAtom = atom<File[]>([]);

export const activeFileAtom = atom<File | undefined>(undefined);

export const unsavedFilePathsAtom = atom((get) => {
  const changes = get(changesAtom);
  return Object.values(changes)
    .filter((c) => c.isDraft)
    .map((c) => c.path);
});

export const saveActiveFileAtom = atom(null, (get, set) => {
  const activeFile = get(activeFileAtom);

  if (!activeFile) return;

  const changes = get(changesAtom);

  const draftChange = Object.values(changes).find(
    (c) => c.isDraft && c.path === activeFile.path
  );

  if (!draftChange) return;

  set(undraftChangeAtom, draftChange.id);
});

export const setFileByPathAtom = atom(
  null,
  (get, set, path: string | undefined) => {
    const fileChanges = get(fileChangesAtom);

    const file = fileChanges.find((f) => f.path === path);

    set(activeFileAtom, file);

    if (!file) return;

    const changesOrder = get(changesOrderAtom);
    const changes = get(changesAtom);

    if (
      file.status !== 'added' &&
      !changesOrder.find((id) => changes[id].path === file.path)
    ) {
      // this is first time change is saved for a file
      set(saveDeltaAtom, {
        file,
        isFileDepChange: true,
        delta: new Delta().insert(file.oldVal),
        highlight: [],
      });
    }

    const highlightChangeId = get(highlightChangeIdAtom);

    if (!highlightChangeId) {
      set(saveFileNodeAtom, file.path);
    }
  }
);
