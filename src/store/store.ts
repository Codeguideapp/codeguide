import produce from 'immer';
import { difference, last } from 'lodash';
import Delta from 'quill-delta';
import create, { GetState, Mutate, SetState, StoreApi } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { diffs as fixtures } from '../__tests__/fixtures/diffs';

export type Change = {
  x: number;
  highlightAsDep: boolean;
  color: string;
  deps: string[];
  width: number;
  delta: Delta;
  deltaInverted: Delta;
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
  preservedOrder: string[];
  activeChangeId?: string;
  activeChangeValue: string;
  updateStore: (cb: (store: Store) => void) => void;
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
        deltaInverted: initialDelta.invert(initialDelta),
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
        deltaInverted: new Delta(),
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

              const appliedIdsNoDraft = store.appliedChangesIds.slice(0, -1);
              const takenCoordinates = calcCoordinates(
                appliedIdsNoDraft.map((id) => ({
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

              const newChangeId = 'something' + Math.random();

              store.updateStore(({ changes }) => {
                changes[newChangeId] = {
                  color: '#374957',
                  width: store.changes.draft.width,
                  x: store.changes.draft.x,
                  actions: {},
                  deps,
                  highlightAsDep: false,
                  delta: draftChangeTransformed,
                  deltaInverted: draftChangeTransformed.invert(baseComposed),
                };
                changes.draft.x =
                  store.changes.draft.x + store.changes.draft.width + 10;
                changes.draft.deps = [...appliedIdsNoDraft, newChangeId];
                changes.draft.delta = new Delta();
              });

              set({
                changesOrder: [...appliedIdsNoDraft, newChangeId, 'draft'],
                preservedOrder: [
                  ...store.preservedOrder.filter((id) => id !== 'draft'),
                  newChangeId,
                  'draft',
                ],
              });
            },
          },
        },
      },
    } as Record<string, Change>,
    changesOrder: ['bla', 'draft'],
    preservedOrder: ['bla', 'draft'],
    updateStore: (cb) =>
      set(
        produce((state) => {
          cb(state);
        })
      ),
    updateAppliedChangesIds: () => {
      // changes ids "left" from playhead
      const changesIdsToApply = get().changesOrder.filter(
        (id) => get().changes[id].x < get().playHeadX
      );
      const lastChangeId = last(changesIdsToApply);

      if (lastChangeId !== get().activeChangeId) {
        const changes = get().changes;
        const deltas: Delta[] = [];
        const appliedSoFar: string[] = [];

        for (const changeId of get().preservedOrder) {
          if (!changesIdsToApply.includes(changeId)) {
            continue;
          }

          const changeDelta = changes[changeId].delta;
          const allChangeDeps = changes[changeId].deps;
          const addedIds = difference(appliedSoFar, allChangeDeps);
          const removedIds = difference(allChangeDeps, appliedSoFar);

          const addedDelta = composeDeltas(
            addedIds.map((id) => changes[id].delta)
          );
          const removedDelta = composeDeltas(
            removedIds.map((id) => changes[id].deltaInverted)
          );

          const changeDelta2 = addedIds.length
            ? addedDelta.transform(changeDelta)
            : changeDelta;

          const changeDelta3 = removedIds.length
            ? removedDelta.transform(changeDelta2)
            : changeDelta2;

          deltas.push(changeDelta3);
          appliedSoFar.push(changeId);
        }

        const str = deltaToString(deltas);

        set({
          activeChangeId: lastChangeId,
          activeChangeValue: str,
          appliedChangesIds: changesIdsToApply,
        });
      }
    },
    updateChangesOrder: (from: string, to: string) => {
      set(
        produce((state: Store) => {
          const fromIndex = state.changesOrder.findIndex((id) => id === from);
          const toIndex = state.changesOrder.findIndex((id) => id === to);

          // moving array item
          const elCopy = state.changesOrder[fromIndex];
          state.changesOrder.splice(fromIndex, 1); // remove from element
          state.changesOrder.splice(toIndex, 0, elCopy); // add elCopy in toIndex
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
