import { atom } from 'jotai';

export const layoutSplitRatio = [70, 30];
export const layoutSplitRatioAtom = atom(layoutSplitRatio);
export const windowHeightAtom = atom(window.innerHeight);
export const windowWidthAtom = atom(window.innerWidth);
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
