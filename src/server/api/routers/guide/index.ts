import { createTRPCRouter } from '../../trpc';
import { deleteGuide } from './deleteGuide';
import { getGuide } from './getGuide';
import { getUserGuides } from './getUserGuides';

export const guideRouter = createTRPCRouter({
  getGuide,
  getUserGuides,
  deleteGuide,
});
