import { atom } from 'jotai';

export const layoutSplitRatioAtom = atom([30, 70]);
export const windowHeightAtom = atom(window.innerHeight);
export const windowWidthAtom = atom(window.innerWidth);
