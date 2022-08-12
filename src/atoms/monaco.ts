import { atom } from 'jotai';
import type * as monaco from 'monaco-editor';

export const selectionsAtom = atom<monaco.Selection[]>([]);
