import { atom } from 'jotai';

export type Guide = {
  type: 'diff' | 'browse';
  id: string;
  createdBy: string;
  owner: string;
  repository: string;
  baseSha: string;
  prNum?: number;
  mergeCommitSha?: string;
};

export const guideAtom = atom<Guide>({
  id: '',
  owner: '',
  createdBy: '',
  repository: '',
  baseSha: '',
  type: 'diff',
});
export const isEditAtom = atom(false);
