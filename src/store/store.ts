import produce from 'immer';
import { debounce, difference, last, uniq } from 'lodash';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';
import create, { GetState, SetState } from 'zustand';

import { getFiles } from '../api/api';
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
  activeChangeId?: string;
  initFile: (path: string) => void;
  updateStore: (cb: (store: Store) => void) => void;
  getContentForChangeId: (change: string) => string;
  updateChangesOrder: (from: string, to: string) => void;
  setPlayheadX: (x: number) => void;
  updateChangesX: () => void;
};

export type Change = {
  id: string;
  isDraft: boolean;
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
  updateChangesX: () => {
    const userDefinedOrder = get().userDefinedOrder;

    get().updateStore(({ changes }) => {
      let x = 10;
      for (const id of userDefinedOrder) {
        changes[id].x = x;
        x += changes[id].width + 10;
      }
    });
  },
  initFile: async (path: string) => {
    const files = await getFiles(0);
    const file = files.find((f) => f.path === path);

    if (!file) {
      throw new Error('file not found');
    }

    get().updateStore((store) => {
      const newId = nanoid();
      const deps = store.userDefinedOrder.filter(
        (id) =>
          store.changes[id].path === path && store.changes[id].isDraft === false
      );

      store.changes[newId] = {
        id: newId,
        isDraft: true,
        x: 0,
        color: '#cccccc',
        width: 50,
        delta: deps.length ? new Delta() : new Delta().insert(file.oldVal),
        deps,
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
      store.userDefinedOrder.push(newId);
      store.preservedOrder.push(newId);
    });
    get().updateChangesX();
    get().setPlayheadX(Infinity);
  },
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
  getContentForChangeId(changeId: string) {
    const { changes, userDefinedOrder, preservedOrder, playHeadX } = get();

    const activePath = changes[changeId].path;
    const changesIdsToApply = userDefinedOrder.filter(
      (id) => changes[id].x < playHeadX && changes[id].path === activePath
    );

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

    return deltaToString(deltas);
  },
  updateChangesOrder: (from: string, to: string) => {
    const store = get();

    if (store.changes[from].isDraft || store.changes[to].isDraft) {
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
  },
  setPlayheadX: (x: number) => {
    const { changes, userDefinedOrder } = get();

    const lastChangeId = last(get().userDefinedOrder);

    const maxPlayheadX = lastChangeId
      ? changes[lastChangeId].x + changes[lastChangeId].width
      : 10;

    const playHeadX = x === Infinity ? maxPlayheadX : x;

    if (get().playHeadX !== playHeadX) {
      const activeChangeId = [...userDefinedOrder]
        .reverse()
        .find((id) => changes[id].x < playHeadX);

      if (activeChangeId !== get().activeChangeId) {
        set({
          activeChangeId,
          playHeadX,
        });
      } else {
        set({
          playHeadX,
        });
      }
    }
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
  const store = get();
  store.setPlayheadX(Infinity);

  const activeChange = store.changes[store.activeChangeId!];
  if (!activeChange) {
    throw new Error('draft is not active');
  }

  const activePath = activeChange.path;
  const appliedIds = store.userDefinedOrder.filter(
    (id) => store.changes[id].path === activePath
  );

  const takenCoordinates = calcCoordinates(
    appliedIds
      .filter((id) => id !== store.activeChangeId)
      .map((id) => ({
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
      const draftTransformed = toUndoDelta.transform(activeChange.delta);
      const draftCoordinates = calcCoordinates([
        {
          id: store.activeChangeId!,
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

  const lastDepIndex = appliedIds.findIndex((id) => id === lastDep);

  const baseIds = appliedIds.slice(0, lastDepIndex + 1);
  const idsToUndo = appliedIds.slice(lastDepIndex + 1, appliedIds.length - 1);

  const baseComposed = composeDeltas(
    baseIds.map((id) => store.changes[id].delta)
  );
  const toUndoComposed = composeDeltas(
    idsToUndo.map((id) => store.changes[id].delta)
  );
  const undoChanges = toUndoComposed.invert(baseComposed);

  const draftChangeTransformed = undoChanges.transform(activeChange.delta);

  const newDraftId = nanoid();

  store.updateStore(({ changes, userDefinedOrder, preservedOrder }) => {
    const draftsOrder = store.userDefinedOrder
      .filter((id) => store.changes[id].isDraft)
      .map((id) => (id === activeChange.id ? newDraftId : id));

    changes[activeChange.id].isDraft = false;
    changes[activeChange.id].color = '#374957';
    changes[activeChange.id].actions = {};
    changes[activeChange.id].deps = deps;
    changes[activeChange.id].delta = draftChangeTransformed;
    changes[activeChange.id].deltaInverted =
      draftChangeTransformed.invert(baseComposed);

    changes[newDraftId] = {
      id: newDraftId,
      isDraft: true,
      color: '#cccccc',
      width: 50,
      x: 0,
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
      deps: appliedIds,
      path: activePath,
      highlightAsDep: false,
      delta: new Delta(),
      deltaInverted: new Delta(),
    };

    userDefinedOrder.push(newDraftId);
    preservedOrder.push(newDraftId);

    userDefinedOrder = userDefinedOrder.sort(
      (a, b) => draftsOrder.indexOf(a) - draftsOrder.indexOf(b)
    );
    preservedOrder = userDefinedOrder.sort(
      (a, b) => draftsOrder.indexOf(a) - draftsOrder.indexOf(b)
    );
  });

  get().updateChangesX();
  store.setPlayheadX(get().changes[newDraftId].x + 10);

  return newDraftId;
}
