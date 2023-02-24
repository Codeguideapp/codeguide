import { isEqual } from 'lodash';

import { Step, useStepsStore } from '../store/steps';

const removeExtraProperties = (change: Step) => {
  // delta, deltaInverted and highlight are not compared because they are changed more often
  // for example while text is selected
  const { delta, deltaInverted, highlight, ...rest } = change;
  return rest;
};

export function useShallowSteps() {
  return useStepsStore(
    (state) => state.steps,
    (oldState, newState) => {
      const oldStateReduced = Object.values(oldState).map(
        removeExtraProperties
      );
      const newStateReduced = Object.values(newState).map(
        removeExtraProperties
      );
      return isEqual(oldStateReduced, newStateReduced);
    }
  );
}
