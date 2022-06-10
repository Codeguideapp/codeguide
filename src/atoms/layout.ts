import { atom } from 'jotai';

export const layoutSplitRatio = [70, 30];
export const layoutSplitRatioAtom = atom(layoutSplitRatio);
export const windowHeightAtom = atom(window.innerHeight);
export const windowWidthAtom = atom(window.innerWidth);
