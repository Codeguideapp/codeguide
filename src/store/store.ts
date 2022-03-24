import produce from 'immer';
import { debounce, difference, isEqual, last, uniq } from 'lodash';
import Delta from 'quill-delta';
import create, { GetState, SetState } from 'zustand';

import { getFile, getFiles, getSuggestions } from '../api/api';
import { Command } from '../edits';
import { calcCoordinates, composeDeltas, deltaToString } from './deltaUtils';

export type Store = {
  layoutSplitRatioBottom: number;
  layoutSplitRatioTop: number;
  windowHeight: number;
  windowWidth: number;
  changes: Record<string, Change>;
  playHeadX: number;
  preservedOrder: string[];
  userDefinedOrder: string[];
  appliedChangesIds: string[];
  activeChangeId?: string;
  activeChangeValue: string;
  activeResultValue: string;
  activePath?: string;
  suggestions: Command[];
  initFile: (path: string) => Promise<string>;
  updateStore: (cb: (store: Store) => void) => void;
  applyChanges: () => void;
  updateChangesOrder: (from: string, to: string) => void;
  setPlayheadX: (x: number) => void;
  updateSuggestions: (currentVal: string) => void;
};

export type Change = {
  x: number;
  highlightAsDep: boolean;
  color: string;
  path: string;
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

export const store = (set: SetState<Store>, get: GetState<Store>): Store => ({
  windowHeight: window.innerHeight,
  windowWidth: window.innerWidth,
  layoutSplitRatioTop: 70,
  layoutSplitRatioBottom: 30,
  suggestions: [],
  activeResultValue: '',
  initFile: async (path: string) => {
    const files = await getFiles(0);
    const file = files.find((f) => f.path === path);

    if (!file) {
      throw new Error('file not found');
    }

    get().updateStore((store) => {
      store.activePath = path;
      store.activeResultValue = file.newVal;
      store.changes.draft = {
        x: 10,
        color: '#cccccc',
        width: 50,
        delta: new Delta().insert(file.oldVal),
        deps: [],
        deltaInverted: new Delta(),
        path,
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
              saveDraft(set, get);
            },
          },
        },
      };
    });

    return saveDraft(set, get);
  },
  activeChangeValue: '',
  appliedChangesIds: [] as string[],
  playHeadX: 0,
  changes: {} as Record<string, Change>,
  userDefinedOrder: [],
  preservedOrder: [],
  updateStore: (cb) =>
    set(
      produce((state) => {
        cb(state);
      })
    ),
  applyChanges: () => {
    const {
      userDefinedOrder,
      changes,
      playHeadX,
      appliedChangesIds,
      preservedOrder,
    } = get();

    // changes ids "left" from playhead
    const changesIdsToApply = userDefinedOrder.filter(
      (id) => changes[id].x < playHeadX
    );

    if (!isEqual(changesIdsToApply, appliedChangesIds)) {
      const deltas: Delta[] = [];
      const appliedSoFar: string[] = [];

      for (const changeId of preservedOrder) {
        if (!changesIdsToApply.includes(changeId)) {
          continue;
        }

        let { delta, deps } = changes[changeId];
        const addedIds = difference(appliedSoFar, deps);
        const removedIds = difference(deps, appliedSoFar);

        if (addedIds.length) {
          const addedDelta = composeDeltas(
            addedIds.map((id) => changes[id].delta)
          );

          delta = addedDelta.transform(delta);
        }

        if (removedIds.length) {
          const removedDelta = composeDeltas(
            removedIds.map((id) => changes[id].deltaInverted)
          );

          delta = delta.transform(removedDelta);
        }

        deltas.push(delta);
        appliedSoFar.push(changeId);
      }

      const activeChangeValue = deltaToString(deltas);

      set({
        activeChangeId: last(changesIdsToApply),
        activeChangeValue,
        appliedChangesIds: changesIdsToApply,
      });

      if (last(changesIdsToApply) === 'draft') {
        get().updateSuggestions(activeChangeValue);
      }
    }
  },
  updateChangesOrder: (from: string, to: string) => {
    const store = get();

    if (from === 'draft' || to === 'draft') {
      throw new Error(`can not move draft change`);
    }
    if (store.changes[from].deps.includes(to)) {
      throw new Error(`${from} is dependend on ${to}`);
    }
    if (store.changes[to].deps.includes(from)) {
      throw new Error(`${to} is dependend on ${from}`);
    }

    store.updateStore(({ userDefinedOrder }) => {
      const fromIndex = userDefinedOrder.indexOf(from);
      const toIndex = userDefinedOrder.indexOf(to);

      // moving array item
      const elCopy = userDefinedOrder[fromIndex];
      userDefinedOrder.splice(fromIndex, 1); // remove from element
      userDefinedOrder.splice(toIndex, 0, elCopy); // add elCopy in toIndex
    });

    store.applyChanges();
  },
  setPlayheadX: (x: number) => {
    const { changes } = get();
    const playHeadX =
      x === Infinity ? changes.draft.x + changes.draft.width : x;

    if (get().playHeadX !== playHeadX) {
      set({ playHeadX });
      get().applyChanges();
    }
  },
  updateSuggestions: async (currentVal: string) => {
    const { activePath } = get();
    const file = activePath ? await getFile(activePath) : null;

    if (!file) {
      set({ suggestions: [] });
      return;
    }

    const suggestions = await getSuggestions(currentVal, file.newVal);

    if (activePath !== get().activePath) {
      // path was changed in the meantine, cancel adding new suggestions
      return;
    }
    console.log({ suggestions });

    set({ suggestions });
  },
});

export const useStore = create(store);

window.addEventListener(
  'resize',
  debounce(() => {
    useStore.setState({
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
    });
  }, 100)
);

export function saveDraft(set: SetState<Store>, get: GetState<Store>) {
  const noDraft = (id: string) => id !== 'draft';
  const store = get();
  store.setPlayheadX(Infinity);

  const takenCoordinates = calcCoordinates(
    store.appliedChangesIds.filter(noDraft).map((id) => ({
      id,
      delta: store.changes[id].delta,
    }))
  );

  const foundDeps = takenCoordinates
    .filter((taken) => {
      // first transforming draft to the point when "taken" was applied
      const toUndo = store.preservedOrder
        .slice(store.preservedOrder.indexOf(taken.id) + 1)
        .slice(0, -1); // removing draft

      const toUndoDelta = composeDeltas(
        toUndo.map((id) => store.changes[id].deltaInverted)
      );
      const draftTransformed = toUndoDelta.transform(store.changes.draft.delta);
      const draftCoordinates = calcCoordinates([
        {
          id: 'draft',
          delta: draftTransformed,
        },
      ]);

      return draftCoordinates.find((draft) => {
        // check if it's overlapping
        if (!taken || !draft) {
          return false;
        }
        if (taken.op === 'insert' && draft.op === 'insert') {
          return taken.to >= draft.from && taken.from <= draft.from;
        }
        return taken.to >= draft.from && taken.from <= draft.to;
      });
    })
    .map(({ id }) => {
      return [...store.changes[id].deps, id];
    })
    .flat();

  const deps = uniq(foundDeps).sort(
    (a, b) => store.preservedOrder.indexOf(a) - store.preservedOrder.indexOf(b)
  );

  const lastDep = last(deps);

  const lastDepIndex = store.appliedChangesIds.findIndex(
    (id) => id === lastDep
  );

  const baseIds = store.appliedChangesIds.slice(0, lastDepIndex + 1);
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

  store.updateStore(({ changes, appliedChangesIds }) => {
    changes[newChangeId] = {
      color: '#374957',
      width: store.changes.draft.width,
      x: store.changes.draft.x,
      actions: {},
      deps,
      path: 'test.ts', // todo
      highlightAsDep: false,
      delta: draftChangeTransformed,
      deltaInverted: draftChangeTransformed.invert(baseComposed),
    };
    changes.draft.x = store.changes.draft.x + store.changes.draft.width + 10;
    changes.draft.deps = [...appliedChangesIds.filter(noDraft), newChangeId];
    changes.draft.delta = new Delta();
  });

  set({
    userDefinedOrder: [
      ...store.appliedChangesIds.filter(noDraft),
      newChangeId,
      'draft',
    ],
    preservedOrder: [
      ...store.preservedOrder.filter(noDraft),
      newChangeId,
      'draft',
    ],
  });

  store.setPlayheadX(Infinity);

  return newChangeId;
}
