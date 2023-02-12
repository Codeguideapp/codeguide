import create from 'zustand';

import { IGuide } from '../../types/Guide';

export const useGuideStore = create<
  IGuide & { isFetching: boolean; setGuide: (guide: IGuide) => void }
>((set, get) => ({
  id: '',
  owner: '',
  createdBy: '',
  repository: '',
  baseSha: '',
  type: 'diff',
  canEdit: [],
  changedFileRefs: [],
  fileRefs: [],
  createdAt: 0,
  setGuide: (guide) => {
    set(guide);
  },
  isFetching: true,
  privateRepoWhenCreated: false,
}));
