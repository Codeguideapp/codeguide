import { atom } from 'jotai';

export const layoutSplitRatioAtom = atom([35, 65]);
export const windowHeightAtom = atom(window.innerHeight);
export const windowWidthAtom = atom(window.innerWidth);
