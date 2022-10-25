import { atom } from 'jotai';

export type Guide = {
  createdBy: string;
  id: string;
  owner: string;
  repository: string;
};

export const guideAtom = atom<Guide>({
  id: '',
  owner: '',
  createdBy: '',
  repository: '',
});
