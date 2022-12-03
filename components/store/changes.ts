import produce from 'immer';
import { last } from 'lodash';
import Delta from 'quill-delta';
import { ulid } from 'ulid';
import create from 'zustand';

import { calcStat, composeDeltas, deltaToString } from '../utils/deltaUtils';
import { useCommentsStore } from './comments';
import { FileNode, useFilesStore } from './files';

export type Changes = Record<string, Readonly<Change>>; // changes is updated using immer so the result object can be read only

export type Change = {
  id: string;
  path: string;
  previewOpened: boolean;
  isFileDepChange?: true;
  isFileNode?: true;
  fileStatus: 'added' | 'modified' | 'deleted';
  isDraft: boolean;
  highlight: {
    offset: number;
    length: number;
  }[];
  delta: Delta;
  deltaInverted?: Delta;
  stat: [number, number];
};

interface SaveDeltaParams {
  delta: Delta;
  highlight: Change['highlight'];
  file: FileNode;
  isFileDepChange?: boolean;
}
interface ChangesState {
  activeChangeId: string | null;
  changes: Changes;
  getChangeIndex: (changeId: string) => number;
  setActiveChangeId: (id: string | null) => void;
  setChangePreview: (changeId: string, opened: boolean) => void;
  saveDelta: (params: SaveDeltaParams) => void;
  saveFileNode: (path: string) => void;
  deleteChange: (id: string) => void;
  undraftChange: (id: string) => void;
}

export const useChangesStore = create<ChangesState>((set, get) => ({
  changes: {},
  activeChangeId: null,
  noviChangeId: null,
  getChangeIndex: (changeId: string) => {
    const { changes } = get();
    const changesOrder = Object.keys(changes).sort();

    const ids = changesOrder.filter(
      (id) => !changes[id].isFileDepChange && !changes[id].isFileNode
    );

    return ids.indexOf(changeId) + 1;
  },
  setActiveChangeId: (activeChangeId: string | null) => {
    set({ activeChangeId });
  },
  setChangePreview: (changeId: string, opened: boolean) => {
    const newChanges = produce(get().changes, (changesDraft) => {
      changesDraft[changeId].previewOpened = opened;
    });
    set({ changes: newChanges });
  },
  saveDelta: (params: SaveDeltaParams) => {
    const { delta, file, highlight, isFileDepChange } = params;
    const changes = get().changes;
    const changesOrder = Object.keys(changes).sort();

    const fileChanges = changesOrder
      .filter((id) => changes[id].path === file.path && changes[id].delta)
      .map((id) => changes[id].delta!);

    const before = deltaToString(fileChanges);
    const after = deltaToString([...fileChanges, delta]);

    let changeStatus: Change['fileStatus'] = 'modified';
    switch (file.status) {
      case 'added':
        changeStatus = fileChanges.length === 0 ? 'added' : 'modified';
        break;
      case 'deleted':
        changeStatus = after === '' ? 'deleted' : 'modified';
        break;
      default:
        changeStatus = file.status;
    }

    const lastChangeId = last(changesOrder);

    if (
      lastChangeId &&
      changes[lastChangeId].isDraft &&
      changes[lastChangeId].path === file.path
    ) {
      const newDelta = changes[lastChangeId].delta!.compose(delta);

      const fileChanges = changesOrder
        .slice(0, changesOrder.length - 1)
        .filter((id) => changes[id].path === file.path && changes[id].delta)
        .map((id) => changes[id].delta!);

      const before = deltaToString(fileChanges);
      const after = deltaToString([...fileChanges, newDelta]);

      const { draftComments, savedComments } = useCommentsStore.getState();

      if (
        before === after &&
        highlight.length === 0 &&
        !draftComments[lastChangeId] &&
        !savedComments[lastChangeId]
      ) {
        const newChanges = produce(changes, (changesDraft) => {
          delete changesDraft[lastChangeId];
        });
        set({ changes: newChanges, activeChangeId: null });
      } else {
        const newChanges = produce(changes, (changesDraft) => {
          changesDraft[lastChangeId].delta = newDelta;
          changesDraft[lastChangeId].deltaInverted = newDelta.invert(
            composeDeltas(fileChanges)
          );
          changesDraft[lastChangeId].stat = calcStat(newDelta);
          changesDraft[lastChangeId].highlight = highlight;
        });
        set({ changes: newChanges, activeChangeId: lastChangeId });
      }
    } else {
      if (before === after && highlight.length === 0) {
        return;
      }

      const newChangeId = ulid();

      const newChanges = produce(changes, (changesDraft) => {
        if (!isFileDepChange) {
          for (const id of changesOrder) {
            if (changesDraft[id].isDraft) {
              changesDraft[id].isDraft = false;
            }
          }
        }

        changesDraft[newChangeId] = {
          isDraft: !isFileDepChange,
          previewOpened: false,
          isFileDepChange: isFileDepChange || undefined,
          fileStatus: changeStatus,
          highlight: highlight,
          id: newChangeId,
          path: file.path,
          delta,
          deltaInverted: delta.invert(composeDeltas(fileChanges)),
          stat: calcStat(delta),
        };
      });

      set({ changes: newChanges });

      if (!isFileDepChange) {
        set({ activeChangeId: newChangeId });
      }
    }
  },
  saveFileNode: (path: string) => {
    let changes = get().changes;
    const file = useFilesStore
      .getState()
      .fileNodes.find((f) => f.path === path);

    if (!file) {
      throw new Error('file not found');
    }

    if (
      file.status !== 'added' &&
      !Object.values(changes).find((change) => change.path === file.path)
    ) {
      // this is first time change is saved for a file
      get().saveDelta({
        file,
        isFileDepChange: true,
        delta: new Delta().insert(file.oldVal),
        highlight: [],
      });

      changes = get().changes;
    }

    const nonDepChanges = Object.keys(changes)
      .sort()
      .filter((id) => !changes[id].isFileDepChange)
      .map((id) => changes[id]);

    const lastChange = last(nonDepChanges);
    const secondLast = nonDepChanges[nonDepChanges.length - 2];

    if (lastChange?.path !== path && lastChange?.isFileNode) {
      if (secondLast?.path === path) {
        const newChanges = produce(changes, (changesDraft) => {
          delete changesDraft[lastChange.id];
        });
        set({ changes: newChanges });
      } else {
        const newChanges = produce(changes, (changesDraft) => {
          changesDraft[lastChange.id].path = path;
        });

        set({ changes: newChanges });
      }
    } else if (!lastChange || lastChange.path !== path) {
      const newChangeId = ulid();

      const newChanges = produce(changes, (changesDraft) => {
        changesDraft[newChangeId] = {
          isFileNode: true,
          isDraft: false,
          previewOpened: false,
          fileStatus: 'modified', // todo
          highlight: [],
          id: newChangeId,
          path,
          delta: new Delta(),
          stat: [0, 0],
          deltaInverted: new Delta(),
        };
      });

      set({ changes: newChanges });
    }
  },
  deleteChange: (id: string) => {
    const changes = get().changes;
    const changesOrder = Object.keys(changes).sort();

    if (last(changesOrder) !== id) {
      throw new Error('only last step can be deleted');
    }

    const newChanges = produce(changes, (changesDraft) => {
      delete changesDraft[id];
    });

    set({ changes: newChanges });

    if (get().activeChangeId === id) {
      set({ activeChangeId: null });
    }
  },
  undraftChange: (id: string) => {
    const changes = get().changes;
    const newChanges = produce(changes, (changesDraft) => {
      changesDraft[id].isDraft = false;
      changesDraft[id].previewOpened = false;
    });
    set({ changes: newChanges, activeChangeId: null });
  },
}));
