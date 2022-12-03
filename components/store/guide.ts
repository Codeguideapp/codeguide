import create from 'zustand';

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

export const useGuideStore = create<Guide>((set, get) => ({
  id: '',
  owner: '',
  createdBy: '',
  repository: '',
  baseSha: '',
  type: 'diff',
}));
