import { isEqual } from 'lodash';

import { useChangesStore } from '../store/changes';

export function useShallowChanges() {
  return useChangesStore(
    (s) => s.changes,
    (oldState, newState) => {
      return isEqual(Object.keys(oldState), Object.keys(newState)) === true;
    }
  );
}
