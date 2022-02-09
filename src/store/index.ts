import { isEqual } from "lodash";
import create, { GetState, SetState } from "zustand";
import {
  StoreApiWithSubscribeWithSelector,
  subscribeWithSelector,
} from "zustand/middleware";
import { Command, createCommands, diff } from "../edits";
import { diffs } from "../__tests__/fixtures/diffs";

type Change = {
  x: number;
  color: string;
  width: number;
  command: Command;
};

type Store = {
  appliedChanges: string[];
  playHeadX: number;
  changes: Record<string, Change>;
  saveChanges: (newChanges: Record<string, Change>) => void;
  setPlayHeadX: (x: number) => void;
  updateAppliedChanges: () => void;
};

const changes = diff(diffs[0].oldVal, diffs[0].newVal);
const commands = createCommands(changes);

export const useStore = create<
  Store,
  SetState<Store>,
  GetState<Store>,
  StoreApiWithSubscribeWithSelector<Store>
>(
  subscribeWithSelector((set, get) => ({
    appliedChanges: [],
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
    updateAppliedChanges: () => {
      const currentChanges = get().appliedChanges;
      const newChanges = Object.entries(get().changes)
        .filter(([, change]) => change.x < get().playHeadX)
        .map(([key]) => key);

      if (!isEqual(currentChanges, newChanges)) {
        set({
          appliedChanges: newChanges,
        });
      }
    },
  }))
);

// update active changes on playhead move or on position swap
useStore.subscribe(
  (state) => [state.playHeadX, state.changes],
  () => {
    useStore.getState().updateAppliedChanges();
  }
);

// useStore.subscribe(
//   (appliedChanges: string[]) => {
//     console.log(
//       `active now: ${appliedChanges.join(",")} and was ${useStore
//         .getState()
//         .lastChanges.join(",")}`
//     );
//   },
//   (state) => state.appliedChanges
// );
