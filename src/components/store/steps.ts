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

export type Steps = Record<string, Readonly<Step>>; // steps are updated using immer so the result object can be read only

export type Step = {
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
  highlight: Step['highlight'];
  file: FileNode;
  isFileDepChange?: boolean;
}
interface StepsState {
  publishedStepIds: string[];
  activeStepId: string | null;
  steps: Steps;
  hasDataToPublish: () => boolean;
  getStepIndex: (stepId: string) => number;
  getActiveStep: () => Step | null;
  setActiveStepId: (id: string | null) => void;
  setStepPreview: (stepId: string, opened: boolean) => void;
  saveDelta: (params: SaveDeltaParams) => void;
  saveFileNode: (path: string) => void;
  deleteStep: (id: string) => void;
  deleteUntilStep: (id: string) => void;
  undraftStep: (id: string) => void;
  publishSteps: () => Promise<{ success: boolean; error?: string }>;
  storeStepsFromServer: (stepsToSave: Step[]) => Promise<void>;
}

export const useStepsStore = create<StepsState>((set, get) => ({
  publishedStepIds: [],
  steps: {},
  activeStepId: null,
  hasDataToPublish: () => {
    const { steps, publishedStepIds } = get();

    const stepsThatShouldBeSaved = Object.values(steps)
      .filter((step) => !step.isFileDepChange)
      .filter(
        (step) =>
          step.isDraft === false ||
          step.stat[0] !== 0 ||
          step.stat[1] !== 0 ||
          step.highlight.length > 0
      );

    const stepsToSave = stepsThatShouldBeSaved.filter(
      (step) => !publishedStepIds.includes(step.id)
    );

    const stepsToDelete = publishedStepIds.filter(
      (id) => !Object.keys(steps).includes(id)
    );

    return stepsToSave.length > 0 || stepsToDelete.length > 0;
  },
  getStepIndex: (stepId: string) => {
    const { steps } = get();
    const stepOrder = Object.keys(steps).sort();

    const ids = stepOrder.filter((id) => !steps[id].isFileDepChange);

    return ids.indexOf(stepId) + 1;
  },
  getActiveStep() {
    const activeStepId = get().activeStepId;
    if (!activeStepId) return null;
    return get().steps[activeStepId];
  },
  setActiveStepId: (activeStepId: string | null) => {
    set({ activeStepId });
  },
  setStepPreview: (stepId: string, opened: boolean) => {
    const newSteps = produce(get().steps, (stepsDraft) => {
      stepsDraft[stepId].previewOpened = opened;
    });
    set({ steps: newSteps });
  },
  saveDelta: (params: SaveDeltaParams) => {
    const { delta, file, highlight, isFileDepChange } = params;
    const steps = get().steps;
    const stepsOrder = Object.keys(steps).sort();

    const fileSteps = stepsOrder
      .filter((id) => steps[id].path === file.path && steps[id].delta)
      .map((id) => steps[id].delta);

    const before = deltaToString(fileSteps);
    const after = deltaToString([...fileSteps, delta]);

    let stepStatus: Step['fileStatus'] = 'modified';
    switch (file.status) {
      case 'added':
        stepStatus = fileSteps.length === 0 ? 'added' : 'modified';
        break;
      case 'deleted':
        stepStatus = after === '' ? 'deleted' : 'modified';
        break;
      default:
        stepStatus = file.status;
    }

    const lastStepId = last(stepsOrder);

    if (
      lastStepId &&
      steps[lastStepId].isDraft &&
      steps[lastStepId].path === file.path
    ) {
      const newDelta = steps[lastStepId].delta.compose(delta);

      const fileSteps = stepsOrder
        .slice(0, stepsOrder.length - 1)
        .filter((id) => steps[id].path === file.path && steps[id].delta)
        .map((id) => steps[id].delta);

      const before = deltaToString(fileSteps);
      const after = deltaToString([...fileSteps, newDelta]);

      const { draftCommentPerStep: draftCommentPerChange, savedComments } =
        useCommentsStore.getState();

      if (
        before === after &&
        highlight.length === 0 &&
        !draftCommentPerChange[lastStepId] &&
        !savedComments[lastStepId]
      ) {
        const newSteps = produce(steps, (stepsDraft) => {
          delete stepsDraft[lastStepId];
        });
        set({ steps: newSteps, activeStepId: null });
      } else {
        const newSteps = produce(steps, (stepsDraft) => {
          stepsDraft[lastStepId].delta = newDelta;
          stepsDraft[lastStepId].deltaInverted = newDelta.invert(
            composeDeltas(fileSteps)
          );
          stepsDraft[lastStepId].stat = calcStat(newDelta);
          stepsDraft[lastStepId].highlight = highlight;
        });
        set({ steps: newSteps, activeStepId: lastStepId });
      }
    } else {
      if (before === after && highlight.length === 0) {
        return;
      }

      const newStepId = generateId();

      const newSteps = produce(steps, (stepsDraft) => {
        if (!isFileDepChange) {
          for (const id of stepsOrder) {
            if (stepsDraft[id].isDraft) {
              stepsDraft[id].isDraft = false;
            }
          }
        }

        stepsDraft[newStepId] = {
          isDraft: !isFileDepChange,
          previewOpened: false,
          isFileDepChange: isFileDepChange || undefined,
          fileStatus: stepStatus,
          highlight: highlight,
          id: newStepId,
          path: file.path,
          delta,
          deltaInverted: delta.invert(composeDeltas(fileSteps)),
          stat: calcStat(delta),
        };
      });

      set({ steps: newSteps });

      if (!isFileDepChange) {
        set({ activeStepId: newStepId });
      }
    }
  },
  saveFileNode: (path: string) => {
    let steps = get().steps;
    const file = useFilesStore
      .getState()
      .fileNodes.find((f) => f.path === path);

    if (!file) {
      throw new Error('file not found');
    }

    if (
      file.status !== 'added' &&
      !Object.values(steps).find((step) => step.path === file.path)
    ) {
      // this is first time step is saved for a file
      get().saveDelta({
        file,
        isFileDepChange: true,
        delta: new Delta().insert(file.oldVal),
        highlight: [],
      });

      steps = get().steps;
    }
  },
  deleteStep: (id: string) => {
    const steps = get().steps;
    const step = steps[id];
    const stepsOrder = Object.keys(steps).sort();
    const stepIndex = stepsOrder.indexOf(id);

    const newSteps = produce(steps, (stepsDraft) => {
      const stepIdBefore = stepsOrder[stepIndex - 1];
      const stepIdAfter = stepsOrder[stepIndex + 1];
      const stepBefore = stepsDraft[stepIdBefore];
      const stepAfter = stepsDraft[stepIdAfter];

      if (stepAfter?.path !== step.path && stepBefore?.path === step.path) {
        delete stepsDraft[stepIdBefore];
      }
      delete stepsDraft[id];
    });

    set({ steps: newSteps });

    const lastStepId = last(Object.keys(get().steps).sort());
    if (lastStepId) {
      useFilesStore.getState().setActiveFileByPath(steps[lastStepId].path);

      set({ activeStepId: lastStepId });
    } else {
      useFilesStore.setState({ activeFile: undefined });
      set({ activeStepId: null });
    }
  },
  deleteUntilStep: (id: string) => {
    const steps = get().steps;
    const stepsOrder = Object.keys(steps).sort();

    const stepsFromId = stepsOrder.slice(stepsOrder.indexOf(id));

    const newSteps = produce(steps, (stepsDraft) => {
      for (const id of stepsFromId) {
        delete stepsDraft[id];
      }
    });

    set({ steps: newSteps });

    const lastStepId = last(Object.keys(get().steps).sort());
    if (lastStepId) {
      useFilesStore.getState().setActiveFileByPath(steps[lastStepId].path);

      set({ activeStepId: lastStepId });
    } else {
      useFilesStore.setState({ activeFile: undefined });
      set({ activeStepId: null });
    }
  },
  undraftStep: (id: string) => {
    const steps = get().steps;
    const newSteps = produce(steps, (stepsDraft) => {
      stepsDraft[id].isDraft = false;
      stepsDraft[id].previewOpened = false;
    });
    set({ steps: newSteps, activeStepId: null });
  },
  publishSteps: async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    const newSteps = produce(get().steps, (stepsDraft) => {
      for (const id of Object.keys(stepsDraft)) {
        stepsDraft[id].isDraft = false;
        stepsDraft[id].previewOpened = false;
      }
    });
    set({ steps: newSteps });

    const stepsToSave = Object.values(get().steps).filter(
      (step) => !get().publishedStepIds.includes(step.id)
    );

    const guideId = useGuideStore.getState().id;

    const stepsToDelete = get().publishedStepIds.filter(
      (id) => !Object.keys(get().steps).includes(id)
    );

    try {
      if (stepsToDelete.length) {
        await fetchWithThrow(`/api/changes?guideId=${guideId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ changeIds: stepsToDelete }),
        }).then((deleted: string[]) => {
          set({
            publishedStepIds: get().publishedStepIds.filter(
              (id) => !deleted.includes(id)
            ),
          });
        });
      }

      if (stepsToSave.length === 0) {
        return {
          success: true,
        };
      }

      await fetchWithThrow(`/api/changes?guideId=${guideId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stepsToSave.slice(0, 25)),
      }).then((saved: string[]) => {
        set({
          publishedStepIds: [...get().publishedStepIds, ...saved],
        });

        // If there are more steps to save, send another request
        if (stepsToSave.length > 25) {
          return get().publishSteps();
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
  storeStepsFromServer: async (stepsToSave: Step[]) => {
    for (const step of stepsToSave) {
      const fileNode = useFilesStore
        .getState()
        .fileNodes.find((f) => f.path === step.path);

      if (!fileNode) {
        if (
          isEditing() &&
          useGuideStore
            .getState()
            .changedFileRefs.find((f) => f.path === step.path)
        ) {
          // if in edit mode, we need to load old/new vals from github
          await useFilesStore.getState().loadFile(step.path);
        } else {
          // if not in edit mode, or file is not diff, file content can be derived
          // from a step (fileDepChange)
          const content = deltaToString([step.delta]);

          useFilesStore.getState().storeFile({
            oldVal: '',
            newVal: content,
            path: step.path,
          });
        }
      }
    }

    const newSteps = produce(get().steps, (stepsDraft) => {
      for (const step of stepsToSave) {
        stepsDraft[step.id] = step;
      }
    });

    set({
      steps: newSteps,
      publishedStepIds: stepsToSave.map((c) => c.id),
    });

    const firstStep = stepsToSave.find((c) => !c.isFileDepChange);
    if (!isEditing() && firstStep) {
      useFilesStore.getState().setActiveFileByPath(firstStep.path);
      get().setActiveStepId(firstStep.id);
    }
  },
}));

export function isHighlightStep(step: Step) {
  return (
    step.highlight.length &&
    !step.isFileDepChange &&
    step.stat[0] === 0 &&
    step.stat[1] === 0
  );
}
