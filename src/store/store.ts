import produce from 'immer';
import { debounce, difference, last, uniq } from 'lodash';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';
import create, { GetState, SetState } from 'zustand';

import { File } from '../api/api';
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
  activePath?: string;
  canEdit: boolean;
  files: File[];
  addFile: (file: File) => string;
  updateStore: (cb: (store: Store) => void) => void;
  getFileContent: (change: string) => string;
  updateChangesOrder: (from: string, to: string) => void;
  setPlayheadX: (x: number) => void;
  setActivePath: (path: string) => void;
  updateChangesX: () => void;
  saveChange: (delta: Delta) => string;
};

export type Change = {
  id: string;
  x: number;
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
  canEdit: true,
  files: [],
  saveChange: (delta) => {
    const newDraftId = nanoid();
    const store = get();
    store.setPlayheadX(Infinity);

    const activePath = store.activePath;
    if (!activePath) throw new Error('no file is active');

    const appliedIds = store.userDefinedOrder.filter(
      (id) => store.changes[id].path === activePath
    );

    const takenCoordinates = calcCoordinates(
      appliedIds.map((id) => ({
        id,
        delta: store.changes[id].delta,
      }))
    );

    const foundDeps = takenCoordinates
      .filter((taken) => {
        // first transforming draft to the point when "taken" was applied
        const toUndo = store.preservedOrder.slice(
          store.preservedOrder.indexOf(taken.id) + 1
        );

        const toUndoDelta = composeDeltas(
          toUndo.map((id) => store.changes[id].deltaInverted)
        );
        const draftTransformed = toUndoDelta.transform(delta);
        const draftCoordinates = calcCoordinates([
          {
            id: newDraftId,
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
      (a, b) =>
        store.preservedOrder.indexOf(a) - store.preservedOrder.indexOf(b)
    );

    const baseIds = appliedIds.filter((id) => deps.includes(id));
    const idsToUndo = appliedIds.filter((id) => !deps.includes(id));

    const baseComposed = composeDeltas(
      baseIds.map((id) => store.changes[id].delta)
    );
    const toUndoComposed = composeDeltas(
      idsToUndo.map((id) => store.changes[id].delta)
    );
    const undoChanges = toUndoComposed.invert(baseComposed);

    const draftChangeTransformed = undoChanges.transform(delta);

    store.updateStore(({ changes, userDefinedOrder, preservedOrder }) => {
      changes[newDraftId] = {
        id: newDraftId,
        color: '#374957',
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
            callback: () => {},
          },
        },
        deps,
        path: activePath,
        delta: draftChangeTransformed,
        deltaInverted: draftChangeTransformed.invert(baseComposed),
      };

      userDefinedOrder.push(newDraftId);
      preservedOrder.push(newDraftId);
    });

    get().updateChangesX();
    get().setPlayheadX(Infinity);

    return newDraftId;
  },
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
  addFile: (file) => {
    const id = nanoid();

    get().updateStore((store) => {
      const change: Change = {
        id,
        actions: {},
        color: '#0074bb',
        delta: new Delta().insert(file.oldVal),
        deltaInverted: new Delta(),
        deps: [],
        path: file.path,
        width: 50,
        x: 0,
      };

      store.changes[id] = change;
      store.userDefinedOrder.push(id);
      store.preservedOrder.push(id);
      store.files.push(file);
    });
    get().updateChangesX();
    get().setPlayheadX(Infinity);

    return id;
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
  getFileContent(changeId: string) {
    const { changes, userDefinedOrder, preservedOrder } = get();

    const change = changes[changeId];
    if (!change) throw new Error('change not found');

    const pathFilteredIds = userDefinedOrder.filter(
      (id) => changes[id].path === change.path
    );
    const changesIdsToApply = pathFilteredIds.slice(
      0,
      pathFilteredIds.indexOf(changeId) + 1
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

    const lastChangeId = last(userDefinedOrder);

    const maxPlayheadX = lastChangeId
      ? changes[lastChangeId].x + changes[lastChangeId].width
      : 10;

    const canEditTreshold = lastChangeId
      ? changes[lastChangeId].x + changes[lastChangeId].width
      : 0;

    const playHeadX = x === Infinity ? maxPlayheadX : x;

    if (get().playHeadX !== playHeadX) {
      const activeChangeId = [...userDefinedOrder]
        .reverse()
        .find((id) => changes[id].x < playHeadX);

      if (activeChangeId !== get().activeChangeId) {
        set({
          activeChangeId,
          playHeadX,
          canEdit: playHeadX >= canEditTreshold,
        });
      } else {
        set({
          playHeadX,
          canEdit: playHeadX >= canEditTreshold,
        });
      }
    }
  },
  setActivePath: (path) => {
    const file = get().files.find((f) => f.path === path);
    if (!file) {
      throw new Error(`could not find ${path}`);
    }

    set({
      activePath: path,
    });
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
