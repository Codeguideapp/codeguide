import { atom } from 'jotai';

export const isEditing = () =>
  document.location.pathname.split('/').pop() === 'edit';

export const showWhitespaceAtom = atom(false);
export const guideIsFetchingAtom = atom(true);
export const expandedFilesAtom = atom<string[]>([]);
export const activeSectionAtom = atom<
  'changedFiles' | 'filesExplorer' | 'guideFiles'
>(isEditing() ? 'changedFiles' : 'filesExplorer');
