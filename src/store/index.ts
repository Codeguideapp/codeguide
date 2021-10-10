import { isEqual } from "lodash";
import create from "zustand";
import { Command, createCommands, diff } from "../edits";
import { diffs } from "../__tests__/fixtures/diffs";

type Change = {
  x: number;
  color: string;
  width: number;
  command: Command;
};

type Store = {
  activeChanges: string[];
  lastChanges: string[];
  playHeadX: number;
  changes: Record<string, Change>;
  saveChanges: (newChanges: Record<string, Change>) => void;
  setPlayHeadX: (x: number) => void;
  updateActiveChanges: () => void;
};

const changes = diff(diffs[0].oldVal, diffs[0].newVal);
const commands = createCommands(changes);

export const useStore = create<Store>((set, get) => ({
  activeChanges: [],
  lastChanges: [],
  playHeadX: 50,
  changes: commands.reduce((acc, command, index) => {
    return {
      ...acc,
      [index]: {
        x: index * 100,
        width: 80,
        color: "red",
        command,
      },
    };
  }, {} as Record<string, Change>),
  setPlayHeadX: (playHeadX) => set({ playHeadX }),
  saveChanges: (newChanges) =>
    set((state) => ({ changes: { ...state.changes, ...newChanges } })),
  updateActiveChanges: () => {
    const currentChanges = get().activeChanges;
    const newChanges = Object.entries(get().changes)
      .filter(([, change]) => change.x < get().playHeadX)
      .map(([key]) => key);

    if (!isEqual(currentChanges, newChanges)) {
      set({
        activeChanges: newChanges,
        lastChanges: currentChanges,
      });
    }
  },
}));

// update active changes on playhead move or on position swap
useStore.subscribe(
  () => {
    useStore.getState().updateActiveChanges();
  },
  (state) => [state.playHeadX, state.changes]
);

// useStore.subscribe(
//   (activeChanges: string[]) => {
//     console.log(
//       `active now: ${activeChanges.join(",")} and was ${useStore
//         .getState()
//         .lastChanges.join(",")}`
//     );
//   },
//   (state) => state.activeChanges
// );
