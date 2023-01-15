import { isEqual } from 'lodash';

import { Change, useChangesStore } from '../store/changes';

const removeExtraProperties = (change: Change) => {
  // delta, deltaInverted and highlight are not compared because they are changed more often
  // for example while text is selected
  const { delta, deltaInverted, highlight, ...rest } = change;
  return rest;
};

export function useShallowChanges() {
  return useChangesStore(
    (state) => state.changes,
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
