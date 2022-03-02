import { isEqual, last } from 'lodash';
import Delta from 'quill-delta';
import create, { GetState, Mutate, SetState, StoreApi } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { diffs as fixtures } from '../__tests__/fixtures/diffs';

// ytext od pocetka
// svaki change je diffUpdate
// kad dođe do drafta ubacuju se novi changeovi i sejva se novi diffupdate

// todo
// draft ko ytext
// monaco ytext bindings
// kad se dođe do drafta, kreira se novi ytext
// sve šta se upiše ide u ytext
// ako u nekom momentu draft je === last applied, novi ytext se stvori
// kad se radi save, ne spremaju se commande nego ytext od last applied i ytext od drafta, compute diff
// draft se applya tako da se dođe to toString() last applied ytext + computed diff

// todo 2
// kad se dođe do drafta, stvori se ytext a sejvane promjene applyayu preko ytext.applyDelta()
// svaka monaco commanda ide u draft ytext i onda se radi toDelta() (mislin da će delta bit minimalna a ne cijela povijest promjena)
// ako se makne sa drafta, ostaje ta delta i kad se vrati na draft, ponovno se kreira ytext

// draft ko ytext jer skužit promjene preko diffa nevalja
// diff nekad izračuna da je potrebno replacat staru promjenu a onda to sjebe sve
// - ytext se kreira sa undo stackom i prestane se capturat do drafta
//   kad treba sejvat, undoa se sve osim zadnjeg
// - proučit ytext delta i kako dobit commande iz drafta
// https://github.com/yjs/yjs#example-sync-two-clients-by-computing-the-differences

// izvršena promjena bez da se undo captura
// save text zadnjeg rezultata ko string
// undo do kraja
// od tog šta je ostalo napravi diffUpdate sa initial
// applyUpdates za sve i provjeri dal je rezultat kao zadnji rez
// ako je, save
// ako nije, napravi ponovno isto sa jednim undo manje i dodaj prvu promjenu kao dep

// undoaj sve i probaj dodat promjenu
// reduaj sve sa promjenom
// ako je isto, nezavisna je promjena

// kako otkrit dal je promjena dependent na neku drugu
// - ako trenutna promjena nešto briše, očito mora postojat šta briše
// - ako trenutna promjena nešto dodaje na mjestu di je prije bilo izbrisano

// invert predhodne promjene, apply nove, vrati invertanu
//  ako je rez isti, ne ovisi o njoj
//  može li slučajno bit isti rez? lažno pozitivan?

export type Change = {
  x: number;
  color: string;
  deps: string[];
  width: number;
  deltas: Delta;
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
  activeFileInitial: string;
  activeFileChanged: string;
  appliedChangesIds: string[];
  playHeadX: number;
  changes: Record<string, Change>;
  activeChangeId?: string;
  draftValue?: string;
  saveChanges: (newChanges: Record<string, Change>) => void;
  setDraftValue: (value: string | undefined) => void;
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
    draftDeltas: [] as Delta[],
    pushDraftDelta: (delta) => {
      const draftDeltas = get().draftDeltas;
      set({ draftDeltas: [...draftDeltas, delta] });
    },
    activeFileInitial: fixtures[0].oldVal,
    activeFileChanged: fixtures[0].oldVal,
    appliedChangesIds: [] as string[],
    playHeadX: 20,
    changes: {
      bla: {
        x: 40,
        color: '#374957',
        width: 50,
        deltas: initialDelta,
        deps: [],
        actions: {},
      },
      draft: {
        x: 100,
        color: '#cccccc',
        width: 50,
        deltas: new Delta(),
        deps: [],
        actions: {
          discardDraft: {
            label: 'Discard Draft',
            color: 'red',
            callback: () => get().setDraftValue(undefined),
          },
          saveChanges: {
            label: 'Save Changes',
            color: 'green',
            callback: () => {
              const store = get();

              const draftChange = store.draftDeltas.reduce((acc, curr) => {
                return acc.compose(curr);
              }, new Delta());

              const getDeltas = (id: string) => {
                if (id === 'draft') {
                  return draftChange;
                }
                return store.changes[id].deltas;
              };

              // const result = deltaToString(
              //   store.appliedChangesIds.map(getDeltas)
              // );

              // kad se radi apply koristi se ytext tako da se lako reordera
              // jer inače je potrebno radit transform delte

              // novi alg, ovaj ne kuži da 1 pa 2 na istom indexu je konflikting change
              // ovisi o orderu, znači na reorder neće imat isti rez

              const idsNoDraft = store.appliedChangesIds.slice(0, -1);
              const takenCoordinates = calcCoordinates(
                idsNoDraft.map((id) => ({
                  id,
                  delta: store.changes[id].deltas,
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

              // const allDeps = [];
              // while (store.appliedChangesIds[testIdIndex]) {
              //   const baseIds = store.appliedChangesIds.slice(0, testIdIndex);
              //   const idsToUndo = store.appliedChangesIds.slice(
              //     testIdIndex,
              //     store.appliedChangesIds.length - 1
              //   );

              //   const baseComposed = composeDeltas(baseIds.map(getDeltas));
              //   const toUndoComposed = composeDeltas(idsToUndo.map(getDeltas));
              //   const undoChanges = toUndoComposed.invert(baseComposed);

              //   const draftChangeTransformed =
              //     undoChanges.transform(draftChange);

              //   const undoChangesTransformed = idsToUndo.map((id) => {
              //     return draftChangeTransformed.transform(getDeltas(id));
              //   });

              //   const takenCoordinates = calcCoordinates(
              //     baseIds.map((id) => ({
              //       id,
              //       delta: store.changes[id].deltas,
              //     }))
              //   );
              //   const draftCoordinates = calcCoordinates([
              //     {
              //       id: 'draft',
              //       delta: draftChangeTransformed,
              //     },
              //   ]);

              //   const deps = takenCoordinates
              //     .filter((draft) => {
              //       return draftCoordinates.find((taken) => {
              //         return isOverlapping(draft, taken);
              //       });
              //     })
              //     .map((c) => c.id);

              //   allDeps.push(deps);

              //   const testString = deltaToString([
              //     baseComposed,
              //     draftChangeTransformed,
              //     composeDeltas(undoChangesTransformed),
              //   ]);

              //   if (testString !== result) {
              //     dep = store.appliedChangesIds[testIdIndex];
              //   } else {
              //     lastDraft = draftChangeTransformed;
              //   }
              //   testIdIndex--;
              // }

              store.saveChanges({
                ['something' + Math.random()]: {
                  color: '#374957',
                  width: store.changes.draft.width,
                  x: store.changes.draft.x,
                  actions: {},
                  deps,
                  deltas: draftChangeTransformed,
                },
                draft: {
                  ...store.changes.draft,
                  x: store.changes.draft.x + store.changes.draft.width + 10,
                },
              });

              // if prev change is base, set as dependency
              // if prev change is not base, invert it, apply new change, revert inverted - u funkciju

              set({ draftDeltas: [] });
            },
          },
        },
      },
    } as Record<string, Change>,
    setDraftValue: (draftValue) => {
      set({
        draftValue,
        changes: {
          ...get().changes,
          draft: {
            ...get().changes.draft,
            color: draftValue ? 'blue' : '#cccccc',
          },
        },
      });
    },
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
        set({ activeChangeId: lastChangeId });
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

export function deltaToString(deltas: Delta[], initial = '') {
  const composeAllDeltas = composeDeltas(deltas);
  return composeAllDeltas.reduce((text, op) => {
    if (!op.insert) return text;
    if (typeof op.insert !== 'string') return text + ' ';

    return text + op.insert;
  }, initial);
}
