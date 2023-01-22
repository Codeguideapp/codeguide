import create from 'zustand';

import { IGuide } from '../../types/Guide';

export const useGuideStore = create<
  IGuide & { setGuide: (guide: IGuide) => void }
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
  setGuide: (guide) => set(guide),
}));
