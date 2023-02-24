import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBackwardStep,
  faForwardStep,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { last } from 'lodash';
import * as Mousetrap from 'mousetrap';
import { useCallback, useEffect, useMemo } from 'react';

import { useShallowSteps } from './hooks/useShallowSteps';
import { isEditing } from './store/atoms';
import { useFilesStore } from './store/files';
import { useStepsStore } from './store/steps';

library.add(faBackwardStep, faForwardStep, faPlay);

export function PrevNextControls() {
  const steps = useShallowSteps();
  const activeStepId = useStepsStore((s) => s.activeStepId);
  const setActiveChangeId = useStepsStore((s) => s.setActiveStepId);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);

  const changesIdsNoFile = useMemo(
    () =>
      Object.keys(steps)
        .sort()
        .filter((id) => !steps[id].isFileDepChange),
    [steps]
  );

  const goToFirstChange = useCallback(() => {
    const firstChange = changesIdsNoFile[0];

    if (!firstChange) return;

    setActiveChangeId(firstChange);
    setActiveFileByPath(steps[firstChange].path);
  }, [changesIdsNoFile, steps, setActiveChangeId, setActiveFileByPath]);

  const goToPrevChange = useCallback(() => {
    if (!activeStepId) {
      const lastChangeId = last(changesIdsNoFile);
      if (lastChangeId) {
        setActiveChangeId(lastChangeId);
        setActiveFileByPath(steps[lastChangeId].path);
      }
      return;
    }

    const currentIndex = changesIdsNoFile.indexOf(activeStepId);

    const prevChangeId = changesIdsNoFile[currentIndex - 1];
    if (!prevChangeId) return;

    setActiveChangeId(prevChangeId);
    setActiveFileByPath(steps[prevChangeId].path);
  }, [
    activeStepId,
    steps,
    changesIdsNoFile,
    setActiveChangeId,
    setActiveFileByPath,
  ]);

  const goToNextChange = useCallback(() => {
    if (!activeStepId) {
      return;
    }

    const currentIndex = changesIdsNoFile.indexOf(activeStepId);
    const nextChangeId: string | undefined = changesIdsNoFile[currentIndex + 1];

    setActiveChangeId(nextChangeId);

    if (nextChangeId) {
      setActiveFileByPath(steps[nextChangeId].path);
    } else if (!isEditing()) {
      setActiveFileByPath(undefined);
    }
  }, [
    activeStepId,
    steps,
    changesIdsNoFile,
    setActiveFileByPath,
    setActiveChangeId,
  ]);

  const goToLastChange = useCallback(() => {
    setActiveChangeId(null);
    if (!isEditing()) {
      setActiveFileByPath(undefined);
    } else {
      const lastChangeId = last(Object.keys(steps).sort());
      if (lastChangeId) {
        setActiveFileByPath(steps[lastChangeId].path);
      }
    }
  }, [steps, setActiveChangeId, setActiveFileByPath]);

  useEffect(() => {
    Mousetrap.bind(['shift+up', 'shift+left'], goToFirstChange);
    Mousetrap.bind(['up', 'left'], goToPrevChange);
    Mousetrap.bind(['down', 'right', 'space'], goToNextChange);
    Mousetrap.bind(['shift+down', 'shift+right'], goToLastChange);

    return () => {
      Mousetrap.unbind('shift+up');
      Mousetrap.unbind('shift+left');
      Mousetrap.unbind('up');
      Mousetrap.unbind('left');
      Mousetrap.unbind('down');
      Mousetrap.unbind('right');
      Mousetrap.unbind('space');
      Mousetrap.unbind('shift+down');
      Mousetrap.unbind('shift+right');
    };
  }, [goToFirstChange, goToPrevChange, goToNextChange, goToLastChange]);

  return null;
}
