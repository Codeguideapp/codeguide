import create from 'zustand';

type Change = {
  x: number;
  color: string;
  width: number;
};

type Store = {
  changes: Record<string, Change>;
  saveChanges: (newChanges: Record<string, Change>) => void;
};

export const useStore = create<Store>((set) => ({
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
  saveChanges: (newChanges) =>
    set((state) => ({ changes: { ...state.changes, ...newChanges } })),
}));
