import { atom } from 'jotai';

export const stepControlHeightAtom = atom(0);
export const showWhitespaceAtom = atom(false);
export const expandedFilesAtom = atom<string[]>([]);
export const activeSectionAtom = atom<'changedFiles' | 'filesExplorer'>(
  'changedFiles'
);
