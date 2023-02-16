import produce from 'immer';
import { last } from 'lodash';
import Delta from 'quill-delta';
import create from 'zustand';

import { calcStat, composeDeltas, deltaToString } from '../../utils/deltaUtils';
import { fetchWithThrow } from '../../utils/fetchWithThrow';
import { generateId } from '../../utils/generateId';
import { isEditing } from './atoms';
import { useCommentsStore } from './comments';
import { FileNode, useFilesStore } from './files';
import { useGuideStore } from './guide';

export type Changes = Record<string, Readonly<Change>>; // changes is updated using immer so the result object can be read only

export type Change = {
  id: string;
  path: string;
  previewOpened: boolean;
  isFileDepChange?: true;
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
  publishedChangeIds: string[];
  activeChangeId: string | null;
  changes: Changes;
  hasDataToPublish: () => boolean;
  getChangeIndex: (changeId: string) => number;
  getActiveChange: () => Change | null;
  setActiveChangeId: (id: string | null) => void;
  setChangePreview: (changeId: string, opened: boolean) => void;
  saveDelta: (params: SaveDeltaParams) => void;
  saveFileNode: (path: string) => void;
  deleteChange: (id: string) => void;
  deleteUntilChange: (id: string) => void;
  undraftChange: (id: string) => void;
  publishChanges: () => Promise<{ success: boolean; error?: string }>;
  storeChangesFromServer: (changesToSave: Change[]) => Promise<void>;
}

export const useChangesStore = create<ChangesState>((set, get) => ({
  publishedChangeIds: [],
  changes: {},
  activeChangeId: null,
  noviChangeId: null,
  hasDataToPublish: () => {
    const { changes, publishedChangeIds } = get();

    const changesThatShouldBeSaved = Object.values(changes)
      .filter((change) => !change.isFileDepChange)
      .filter(
        (change) =>
          change.isDraft === false ||
          change.stat[0] !== 0 ||
          change.stat[1] !== 0 ||
          change.highlight.length > 0
      );

    const changesToSave = changesThatShouldBeSaved.filter(
      (change) => !publishedChangeIds.includes(change.id)
    );

    const changesToDelete = publishedChangeIds.filter(
      (id) => !Object.keys(changes).includes(id)
    );

    return changesToSave.length > 0 || changesToDelete.length > 0;
  },
  getChangeIndex: (changeId: string) => {
    const { changes } = get();
    const changesOrder = Object.keys(changes).sort();

    const ids = changesOrder.filter((id) => !changes[id].isFileDepChange);

    return ids.indexOf(changeId) + 1;
  },
  getActiveChange() {
    const activeChangeId = get().activeChangeId;
    if (!activeChangeId) return null;
    return get().changes[activeChangeId];
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
      .map((id) => changes[id].delta);

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
      const newDelta = changes[lastChangeId].delta.compose(delta);

      const fileChanges = changesOrder
        .slice(0, changesOrder.length - 1)
        .filter((id) => changes[id].path === file.path && changes[id].delta)
        .map((id) => changes[id].delta);

      const before = deltaToString(fileChanges);
      const after = deltaToString([...fileChanges, newDelta]);

      const { draftCommentPerChange, savedComments } =
        useCommentsStore.getState();

      if (
        before === after &&
        highlight.length === 0 &&
        !draftCommentPerChange[lastChangeId] &&
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

      const newChangeId = generateId();

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
  },
  deleteChange: (id: string) => {
    const changes = get().changes;
    const change = changes[id];
    const changesOrder = Object.keys(changes).sort();
    const changeIndex = changesOrder.indexOf(id);

    const newChanges = produce(changes, (changesDraft) => {
      const changeIdBefore = changesOrder[changeIndex - 1];
      const changeIdAfter = changesOrder[changeIndex + 1];
      const changeBefore = changesDraft[changeIdBefore];
      const changeAfter = changesDraft[changeIdAfter];

      if (
        changeAfter?.path !== change.path &&
        changeBefore?.path === change.path
      ) {
        delete changesDraft[changeIdBefore];
      }
      delete changesDraft[id];
    });

    set({ changes: newChanges });

    const lastChangeId = last(Object.keys(get().changes).sort());
    if (lastChangeId) {
      useFilesStore.getState().setActiveFileByPath(changes[lastChangeId].path);

      set({ activeChangeId: lastChangeId });
    } else {
      useFilesStore.setState({ activeFile: undefined });
      set({ activeChangeId: null });
    }
  },
  deleteUntilChange: (id: string) => {
    const changes = get().changes;
    const changesOrder = Object.keys(changes).sort();

    const changesFromId = changesOrder.slice(changesOrder.indexOf(id));

    const newChanges = produce(changes, (changesDraft) => {
      for (const id of changesFromId) {
        delete changesDraft[id];
      }
    });

    set({ changes: newChanges });

    const lastChangeId = last(Object.keys(get().changes).sort());
    if (lastChangeId) {
      const lastChange = changes[lastChangeId];
      useFilesStore.getState().setActiveFileByPath(changes[lastChangeId].path);

      set({ activeChangeId: lastChangeId });
    } else {
      useFilesStore.setState({ activeFile: undefined });
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
  publishChanges: async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    const newChanges = produce(get().changes, (changesDraft) => {
      for (const id of Object.keys(changesDraft)) {
        changesDraft[id].isDraft = false;
        changesDraft[id].previewOpened = false;
      }
    });
    set({ changes: newChanges });

    const changesToSave = Object.values(get().changes).filter(
      (change) => !get().publishedChangeIds.includes(change.id)
    );

    const guideId = useGuideStore.getState().id;

    const changesToDelete = get().publishedChangeIds.filter(
      (id) => !Object.keys(get().changes).includes(id)
    );

    try {
      if (changesToDelete.length) {
        await fetchWithThrow(`/api/changes?guideId=${guideId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ changeIds: changesToDelete }),
        }).then((deleted: string[]) => {
          set({
            publishedChangeIds: get().publishedChangeIds.filter(
              (id) => !deleted.includes(id)
            ),
          });
        });
      }

      if (changesToSave.length === 0) {
        return {
          success: true,
        };
      }

      await fetchWithThrow(`/api/changes?guideId=${guideId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changesToSave.slice(0, 25)),
      }).then((saved: string[]) => {
        set({
          publishedChangeIds: [...get().publishedChangeIds, ...saved],
        });

        // If there are more changes to save, send another request
        if (changesToSave.length > 25) {
          return get().publishChanges();
        } else {
          return {
            success: true,
          };
        }
      });

      return {
        success: true,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  },
  storeChangesFromServer: async (changesToSave: Change[]) => {
    for (const change of changesToSave) {
      const fileNode = useFilesStore
        .getState()
        .fileNodes.find((f) => f.path === change.path);

      if (!fileNode) {
        if (
          isEditing() &&
          useGuideStore
            .getState()
            .changedFileRefs.find((f) => f.path === change.path)
        ) {
          // if in edit mode, we need to load old/new vals from github
          await useFilesStore.getState().loadFile(change.path);
        } else {
          // if not in edit mode, or file is not diff, file content can be derived
          // from a change (fileDepChange)
          const content = deltaToString([change.delta]);

          useFilesStore.getState().storeFile({
            oldVal: '',
            newVal: content,
            path: change.path,
          });
        }
      }
    }

    const newChanges = produce(get().changes, (changesDraft) => {
      for (const change of changesToSave) {
        changesDraft[change.id] = change;
      }
    });

    set({
      changes: newChanges,
      publishedChangeIds: changesToSave.map((c) => c.id),
    });

    const firstStep = changesToSave.find((c) => !c.isFileDepChange);
    if (!isEditing() && firstStep) {
      useFilesStore.getState().setActiveFileByPath(firstStep.path);
      get().setActiveChangeId(firstStep.id);
    }
  },
}));

export function isHighlightChange(change: Change) {
  return (
    change.highlight.length &&
    !change.isFileDepChange &&
    change.stat[0] === 0 &&
    change.stat[1] === 0
  );
}
