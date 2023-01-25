import { atom } from 'jotai';

export const isEditing = () =>
  document.location.pathname.split('/').pop() === 'edit';

export const showWhitespaceAtom = atom(false);
export const expandedFilesAtom = atom<string[]>([]);
export const activeSectionAtom = atom<'changedFiles' | 'filesExplorer'>(
  isEditing() ? 'changedFiles' : 'filesExplorer'
);
