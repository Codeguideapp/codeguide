import create from 'zustand';

type Change = {
  x: number;
  color: string;
  width: number;
};

type Store = {
  playHeadX: number;
  changes: Record<string, Change>;
  saveChanges: (newChanges: Record<string, Change>) => void;
  setPlayHeadX: (x: number) => void;
};

export const useStore = create<Store>((set) => ({
  playHeadX: 50,
  changes: {
    prvi: {
      x: 100,
      width: 100,
      color: 'blue',
    },
    drugi: {
      x: 300,
      width: 100,
      color: 'red',
    },
    treci: {
      x: 500,
      width: 100,
      color: 'green',
    },
  },
  setPlayHeadX: (playHeadX) => set({ playHeadX }),
  saveChanges: (newChanges) =>
    set((state) => ({ changes: { ...state.changes, ...newChanges } })),
}));
