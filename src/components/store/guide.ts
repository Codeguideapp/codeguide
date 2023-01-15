import create from 'zustand';

import { IGuide } from '../../types/Guide';

export const useGuideStore = create<IGuide>((set, get) => ({
  id: '',
  owner: '',
  createdBy: '',
  repository: '',
  baseSha: '',
  type: 'diff',
  canEdit: [],
}));
