import { isEqual, last } from 'lodash';
import Delta from 'quill-delta';
import * as Y from 'yjs';
import create, { GetState, Mutate, SetState, StoreApi } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { diffs as fixtures } from '../__tests__/fixtures/diffs';
import { createYText, sync } from '../edits';

export type Change = {
  x: number;
  color: string;
  deps: string[];
  width: number;
  delta: Delta;
  actions: Record<
    string,
    {
      label: string;
      color: string;
      callback: () => void;
    }
  >;
};

type Store = {
  draftDeltas: Delta[];
  appliedChangesIds: string[];
  playHeadX: number;
  changes: Record<string, Change>;
  activeChangeId?: string;
  activeChangeValue: string;
  saveChanges: (newChanges: Record<string, Change>) => void;
  setPlayHeadX: (x: number) => void;
  updateAppliedChangesIds: () => void;
  pushDraftDelta: (delta: Delta) => void;
};

const initialDelta = new Delta();
initialDelta.insert(fixtures[0].oldVal);

export const useStore = create<
  Store,
  SetState<Store>,
  GetState<Store>,
  Mutate<StoreApi<Store>, [['zustand/subscribeWithSelector', never]]>
>(
  subscribeWithSelector((set, get) => ({
    activeChangeValue: '',
    draftDeltas: [] as Delta[],
    pushDraftDelta: (delta) => {
      const draftDeltas = get().draftDeltas;
      set({ draftDeltas: [...draftDeltas, delta] });
    },
    appliedChangesIds: [] as string[],
    playHeadX: 20,
    changes: {
      bla: {
        x: 40,
        color: '#374957',
        width: 50,
        delta: initialDelta,
        deps: [],
        actions: {},
      },
      draft: {
        x: 100,
        color: '#cccccc',
        width: 50,
        delta: new Delta(),
        deps: [],
        actions: {
          discardDraft: {
            label: 'Discard Draft',
            color: 'red',
            callback: () => {},
          },
          saveChanges: {
            label: 'Save Changes',
            color: 'green',
            callback: () => {
              const store = get();

              const draftChange = composeDeltas(store.draftDeltas);

              const getDeltas = (id: string) => {
                if (id === 'draft') {
                  return draftChange;
                }
                return store.changes[id].delta;
              };

              const idsNoDraft = store.appliedChangesIds.slice(0, -1);
              const takenCoordinates = calcCoordinates(
                idsNoDraft.map((id) => ({
                  id,
                  delta: store.changes[id].delta,
                }))
              );
              const draftCoordinates = calcCoordinates([
                {
                  id: 'draft',
                  delta: draftChange,
                },
              ]);

              const deps = takenCoordinates
                .filter((draft) => {
                  return draftCoordinates.find((taken) => {
                    return isOverlapping(draft, taken);
                  });
                })
                .map((c) => c.id);

              const lastDep = last(deps);
              const lastDepIndex = store.appliedChangesIds.findIndex(
                (id) => id === lastDep
              );

              const baseIds = store.appliedChangesIds.slice(
                0,
                lastDepIndex + 1
              );
              const idsToUndo = store.appliedChangesIds.slice(
                lastDepIndex + 1,
                store.appliedChangesIds.length - 1
              );

              const baseComposed = composeDeltas(baseIds.map(getDeltas));
              const toUndoComposed = composeDeltas(idsToUndo.map(getDeltas));
              const undoChanges = toUndoComposed.invert(baseComposed);

              const draftChangeTransformed = undoChanges.transform(draftChange);

              store.saveChanges({
                ['something' + Math.random()]: {
                  color: '#374957',
                  width: store.changes.draft.width,
                  x: store.changes.draft.x,
                  actions: {},
                  deps,
                  delta: draftChangeTransformed,
                },
                draft: {
                  ...store.changes.draft,
                  x: store.changes.draft.x + store.changes.draft.width + 10,
                },
              });

              set({ draftDeltas: [] });
            },
          },
        },
      },
    } as Record<string, Change>,
    setPlayHeadX: (playHeadX) => set({ playHeadX }),
    saveChanges: (newChanges) =>
      set((state) => ({ changes: { ...state.changes, ...newChanges } })),
    updateAppliedChangesIds: () => {
      // changes ids of currently applied changes
      const appliedChangesIds = get().appliedChangesIds;
      // changes ids "left" from playhead
      const changesIdsToApply = Object.entries(get().changes)
        .filter(([, change]) => change.x < get().playHeadX)
        .sort(([aId, a], [bId, b]) => {
          if (aId === 'draft') {
            return 1;
          } else if (bId === 'draft') {
            return -1;
          } else {
            return a.x - b.x;
          }
        })
        .map(([key]) => key);

      if (!isEqual(appliedChangesIds, changesIdsToApply)) {
        // something was changed (new change or swap)
        // set new appliedChangesIds

        set({
          appliedChangesIds: changesIdsToApply,
        });
      }

      const lastChangeId = last(changesIdsToApply);

      if (lastChangeId !== get().activeChangeId) {
        const yTextPerChange: Record<string, Y.Text> = {};
        const targetYText = createYText('');

        for (const id of appliedChangesIds) {
          const { delta, deps } =
            id === 'draft'
              ? {
                  delta: composeDeltas(get().draftDeltas),
                  deps: appliedChangesIds.slice(0, -1),
                }
              : get().changes[id];

          const lastDep = last(deps);

          const changeYtext = createYText(
            lastDep ? yTextPerChange[lastDep] : ''
          );
          changeYtext.applyDelta(delta.ops);
          yTextPerChange[id] = changeYtext;

          sync(changeYtext, targetYText);
        }

        set({
          activeChangeId: lastChangeId,
          activeChangeValue: targetYText.toString(),
        });
      }
    },
  }))
);

// update active changes on playhead move or on position swap
useStore.subscribe(
  (state) => [state.playHeadX, state.changes],
  () => {
    useStore.getState().updateAppliedChangesIds();
  }
);

type Coordinate = { from: number; to: number; id: string };

function isOverlapping(first: Coordinate, second: Coordinate) {
  return first.to >= second.from && first.from <= second.to;
}

function calcCoordinates(data: { delta: Delta; id: string }[]): Coordinate[] {
  return data
    .map(({ delta, id }) => {
      let index = 0;
      return delta
        .map((op) => {
          if (op.retain) {
            index += op.retain;
            return null;
          } else {
            const from = index;
            index +=
              typeof op.insert === 'string' ? op.insert.length : op.delete || 0;

            return {
              id,
              from,
              to: index,
            };
          }
        })
        .filter((op) => op !== null);
    })
    .flat() as Coordinate[];
}

function composeDeltas(deltas: Delta[]) {
  return deltas.reduce((acc, curr) => acc.compose(curr), new Delta());
}
