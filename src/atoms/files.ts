import { atom } from 'jotai';

import { File, getFiles } from '../api/api';

export const activeFileAtom = atom<File | undefined>(undefined);
export const fileChangesAtom = atom<File[]>([]);

export const setFileChangesAtom = atom(null, async (get, set, pr: number) => {
  const files = await getFiles(pr);

  set(fileChangesAtom, files);
});
