import { atom } from 'jotai';

export const windowHeightAtom = atom(window.innerHeight);
export const windowWidthAtom = atom(window.innerWidth);

type Section = 'changedFiles' | 'filesExplorer';
export const activeSectionAtom = atom<Section>('changedFiles');
