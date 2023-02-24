import { useMemo } from 'react';

import { useStepsStore } from '../store/steps';
import { useShallowSteps } from './useShallowSteps';

export function useActiveChange() {
  const activeChangeId = useStepsStore((s) => s.activeStepId);
  const steps = useShallowSteps();

  return useMemo(() => {
    return activeChangeId ? steps[activeChangeId] : null;
  }, [activeChangeId, steps]);
}
