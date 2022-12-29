import { Session } from 'next-auth';
import { getSession } from 'next-auth/react';
import { Octokit } from 'octokit';
import create from 'zustand';

type UserStore = {
  _userSession: Session | null;
  _octokit: Octokit | null;
  getOctokit: () => Promise<Octokit>;
  getUserSession: () => Promise<Session | null>;
};

export const useUserStore = create<UserStore>((set, get) => ({
  _userSession: null,
  _octokit: null,
  getUserSession: async () => {
    if (get()._userSession) {
      return get()._userSession;
    }
    const session = await getSession().catch((err) => null);

    set({ _userSession: session });
    return session;
  },
  getOctokit: async () => {
    if (get()._octokit) {
      return get()._octokit as Octokit;
    }
    const session = await get().getUserSession();

    const octokit = new Octokit({
      auth: session?.user.accessToken,
    });

    set({ _octokit: octokit });
    return octokit;
  },
}));
