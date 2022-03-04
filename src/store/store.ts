import produce from 'immer';
import { isEqual, last } from 'lodash';
import Delta from 'quill-delta';
import create, { GetState, Mutate, SetState, StoreApi } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { diffs as fixtures } from '../__tests__/fixtures/diffs';

let globalChange = 1;

export type Change = {
  x: number;
  highlightAsDep: boolean;
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
  appliedChangesIds: string[];
  playHeadX: number;
  changes: Record<string, Change>;
  changesOrder: string[];
  activeChangeId?: string;
  activeChangeValue: string;
  saveChanges: (newChanges: Record<string, Change>) => void;
  saveChanges2: (cb: (store: Store) => void) => void;
  setPlayHeadX: (x: number) => void;
  updateAppliedChangesIds: () => void;
  updateChangesOrder: (from: string, to: string) => void;
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
        highlightAsDep: false,
      },
      draft: {
        x: 100,
        color: '#cccccc',
        width: 50,
        delta: new Delta(),
        deps: ['bla'],
        highlightAsDep: false,
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
                  delta: store.changes.draft.delta,
                },
              ]);

              const deps = takenCoordinates
                .filter((taken) => {
                  return draftCoordinates.find((draft) => {
                    // mislim da ovaj draft treba transformirat
                    const transformedTaken = calcCoordinates([
                      {
                        id: taken.id,
                        delta: rebaseChangeToDepState(
                          taken.id,
                          store.appliedChangesIds,
                          store.changes
                        ),
                      },
                    ]);
                    return isOverlapping(transformedTaken[0], draft);
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

              const baseComposed = composeDeltas(
                baseIds.map((id) => store.changes[id].delta)
              );
              const toUndoComposed = composeDeltas(
                idsToUndo.map((id) => store.changes[id].delta)
              );
              const undoChanges = toUndoComposed.invert(baseComposed);

              const draftChangeTransformed = undoChanges.transform(
                store.changes.draft.delta
              );

              //const newChangeId = 'something' + Math.random();
              const newChangeId = String(globalChange);
              globalChange++;

              store.saveChanges({
                [newChangeId]: {
                  color: '#374957',
                  width: store.changes.draft.width,
                  x: store.changes.draft.x,
                  actions: {},
                  deps,
                  highlightAsDep: false,
                  delta: draftChangeTransformed,
                },
                draft: {
                  ...store.changes.draft,
                  x: store.changes.draft.x + store.changes.draft.width + 10,
                  deps: [...idsNoDraft, newChangeId],
                  delta: new Delta(),
                },
              });

              set({
                changesOrder: [...idsNoDraft, newChangeId, 'draft'],
              });
            },
          },
        },
      },
    } as Record<string, Change>,
    changesOrder: ['bla', 'draft'],
    setPlayHeadX: (playHeadX) => set({ playHeadX }),
    saveChanges: (newChanges) => {
      set((state) => {
        return { changes: { ...state.changes, ...newChanges } };
      });
    },

    saveChanges2: (cb) =>
      set(
        produce((state) => {
          cb(state);
        })
      ),
    updateAppliedChangesIds: () => {
      // changes ids of currently applied changes
      const appliedChangesIds = get().appliedChangesIds;
      // changes ids "left" from playhead
      const changesIdsToApply = get().changesOrder.filter(
        (id) => get().changes[id].x < get().playHeadX
      );

      if (!isEqual(appliedChangesIds, changesIdsToApply)) {
        // something was changed (new change or swap)
        // set new appliedChangesIds

        set({
          appliedChangesIds: changesIdsToApply,
        });
      }

      const lastChangeId = last(changesIdsToApply);

      if (lastChangeId !== get().activeChangeId) {
        const deltas = appliedChangesIds.map((id, i) => {
          return rebaseChangeToDepState(
            id,
            appliedChangesIds.slice(0, i),
            get().changes
          );
        });

        const str = deltaToString(deltas);

        set({
          activeChangeId: lastChangeId,
          activeChangeValue: str,
        });
      }
    },
    updateChangesOrder: (from: string, to: string) => {
      // ako "2" prebaciš na početak, se "3" mora transformirat
      // "1" ne jer se on applya na "bla" koji je netaknut reorderom
      // old: record<id, index>, new: record<id, index>
      // loop na svaki change i pogledaj dal je njegov lastDep promijenjen
      // tako da provjeri dal je old index === new index

      set(
        produce((state: Store) => {
          const fromIndex = state.changesOrder.findIndex((id) => id === from);
          const toIndex = state.changesOrder.findIndex((id) => id === to);

          const oldIndexes: Record<string, string> = state.changesOrder.reduce(
            (acc, curr, index) => {
              return {
                ...acc,
                [curr]: index,
              };
            },
            {}
          );

          // moving array item
          const elCopy = state.changesOrder[fromIndex];
          state.changesOrder.splice(fromIndex, 1); // remove from element
          state.changesOrder.splice(toIndex, 0, elCopy); // add elCopy in toIndex

          const newIndexes: Record<string, string> = state.changesOrder.reduce(
            (acc, curr, index) => {
              return {
                ...acc,
                [curr]: index,
              };
            },
            {}
          );

          for (const changeId of state.changesOrder) {
            const lastDep = last(state.changes[changeId].deps);
            if (lastDep && oldIndexes[lastDep] !== newIndexes[lastDep]) {
              // change which dependency has changed

              if (fromIndex > toIndex) {
                // taking something from the future into the past

                // transforming change
                state.changes[changeId].delta = state.changes[
                  from
                ].delta.transform(state.changes[changeId].delta);
              } else {
                // usecase koji ne radi
                // "1" dodat, pobrisat char di je inače 2, 3 dodat,
                // move 2 change i vrati ju nazad

                // moguće da treba dep transformirat, a ne samo changeId

                // taking something applied in past and moving it in future which changed a "from" dependency

                // usecase example:
                // moving "2" to be after "1"
                // means that "3" (which has "1" as dep) needs to transform its delta by unding "2" delta
                // so it is inserted in index 100 rather than 101

                // basically delta "from" is no longer valid
                // it needs to be transformed by taking new dependecy state in account
                // this is done by rebasing "from" delta to new depState
                // and then inverting "from" delta using that depState
                const depState = rebaseChangeToDepState(
                  lastDep,
                  get().appliedChangesIds.slice(0, fromIndex),
                  state.changes
                );

                state.changes[changeId].delta = state.changes[from].delta
                  .invert(depState)
                  .transform(state.changes[changeId].delta);
              }
            }
          }
        })
      );

      get().updateAppliedChangesIds();
    },
  }))
);

// update active changes on playhead move or on position swap
useStore.subscribe(
  (state) => [state.playHeadX],
  () => {
    useStore.getState().updateAppliedChangesIds();
  }
);

type Coordinate = { from: number; to: number; id: string };

function isOverlapping(first: Coordinate, second: Coordinate) {
  if (!first || !second) {
    return false;
  }
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

function deltaToString(deltas: Delta[], initial = '') {
  const composeAllDeltas = composeDeltas(deltas);
  return composeAllDeltas.reduce((text, op) => {
    if (!op.insert) return text;
    if (typeof op.insert !== 'string') return text + ' ';

    return text + op.insert;
  }, initial);
}

// taking all changes from "changeId" dependency (everything that happened afterwards)
// transforming changeId's delta by taking that into account
// in other words rabasing change to current state
function rebaseChangeToDepState(
  changeId: string,
  appliedIds: string[],
  changes: Record<string, Change>
) {
  const { deps, delta } = changes[changeId];

  const lastDep = last(deps);
  const lastDepIndex = appliedIds.findIndex((i) => i === lastDep);
  const changesIdFromDep = appliedIds.slice(lastDepIndex + 1);
  const changesFromDepComposed = composeDeltas(
    changesIdFromDep.map((id) => changes[id].delta)
  );
  return changesFromDepComposed.transform(delta);
}
