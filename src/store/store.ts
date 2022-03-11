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
  changes: Record<string, Change>;
  playHeadX: number;
  preservedOrder: string[];
  userDefinedOrder: string[];
  appliedChangesIds: string[];
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

              const lastDepCoordinate = takenCoordinates
                .reverse() // searching from the last change
                .find((taken) => {
                  // first transforming draft to the point when "taken" was applied
                  const toUndo = store.preservedOrder
                    .slice(store.preservedOrder.indexOf(taken.id) + 1)
                    .slice(0, -1); // removing draft

                  const toUndoDelta = composeDeltas(
                    toUndo.map((id) => store.changes[id].deltaInverted)
                  );
                  const draftTransformed = toUndoDelta.transform(
                    store.changes.draft.delta
                  );
                  const draftCoordinates = calcCoordinates([
                    {
                      id: 'draft',
                      delta: draftTransformed,
                    },
                  ]);

                  return draftCoordinates.find((draft) => {
                    return isOverlapping(taken, draft);
                  });
                });

              const lastDep = lastDepCoordinate?.id;

              // taking deps from lastDeps and adding a new one.
              // doing this because when searching for dep coordinate,
              // there is an undo step which can delete the draft change
              // for example adding a single char then deleting it
              const deps = lastDep
                ? [...store.changes[lastDep].deps, lastDep]
                : [];

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
                userDefinedOrder: [...appliedIdsNoDraft, newChangeId, 'draft'],
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
    userDefinedOrder: ['bla', 'draft'],
    preservedOrder: ['bla', 'draft'],
    updateStore: (cb) =>
      set(
        produce((state) => {
          cb(state);
        })
      ),
    updateAppliedChangesIds: () => {
      // changes ids "left" from playhead
      const changesIdsToApply = get().userDefinedOrder.filter(
        (id) => get().changes[id].x < get().playHeadX
      );
      const lastChangeId = last(changesIdsToApply);

      if (lastChangeId !== get().activeChangeId) {
        // not working: add 1, remove 1
        // provjerit i zasto remove 1 nema bla kao dep
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
          const fromIndex = state.userDefinedOrder.indexOf(from);
          const toIndex = state.userDefinedOrder.indexOf(to);

          // moving array item
          const elCopy = state.userDefinedOrder[fromIndex];
          state.userDefinedOrder.splice(fromIndex, 1); // remove from element
          state.userDefinedOrder.splice(toIndex, 0, elCopy); // add elCopy in toIndex
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

type Coordinate = {
  from: number;
  to: number;
  id: string;
  op: 'insert' | 'delete';
};

function isOverlapping(first: Coordinate, second: Coordinate) {
  if (!first || !second) {
    return false;
  }
  if (first.op === 'insert' && second.op === 'insert') {
    return first.to >= second.from && first.from <= second.from;
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
          } else if (op.delete) {
            return {
              id,
              from: index,
              to: index,
              op: 'delete',
            };
          } else if (typeof op.insert === 'string') {
            const from = index;
            index += op.insert.length;

            return {
              id,
              from,
              to: index,
              op: 'insert',
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
