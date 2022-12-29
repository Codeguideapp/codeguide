import { atom } from 'jotai';

export const isEditing = () =>
  document.location.pathname.split('/').pop() === 'edit';

export const stepControlHeightAtom = atom(0);
export const showWhitespaceAtom = atom(false);
export const expandedFilesAtom = atom<string[]>([]);
export const activeSectionAtom = atom<'changedFiles' | 'filesExplorer'>(
  isEditing() ? 'changedFiles' : 'filesExplorer'
);
