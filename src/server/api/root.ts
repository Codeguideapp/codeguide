import { deleteGuide } from './procedures/deleteGuide';
import { getGuide } from './procedures/getGuide';
import { getUserGuides } from './procedures/getUserGuides';
import { publishGuide } from './procedures/publishGuide';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  getGuide,
  getUserGuides,
  deleteGuide,
  publishGuide,
});

// export type definition of API
export type AppRouter = typeof appRouter;
