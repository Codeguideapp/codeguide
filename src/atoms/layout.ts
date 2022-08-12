import { atom } from 'jotai';

let timeout: NodeJS.Timeout;

export const windowHeightAtom = atom(window.innerHeight);
export const windowWidthAtom = atom(window.innerWidth);
export const highlightToEditButtonAtom = atom(false);
export const toggleBackToEditButtonAtom = atom(null, (get, set) => {
  set(highlightToEditButtonAtom, true);
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    set(highlightToEditButtonAtom, false);
  }, 200);
});

export const contextMenuAtom = atom<
  | {
      top: number;
      left: number;
      items: {
        label: string;
        onClick: () => void;
      }[];
    }
  | undefined
>(undefined);
export const showAddCommentDialogAtom = atom(false);

type Section = 'changedFiles' | 'filesExplorer';
export const activeSectionAtom = atom<Section>('changedFiles');
