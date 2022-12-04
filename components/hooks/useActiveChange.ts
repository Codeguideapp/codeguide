import { useMemo } from 'react';

import { useChangesStore } from '../store/changes';
import { useShallowChanges } from './useShallowChanges';

export function useActiveChange() {
  const activeChangeId = useChangesStore((s) => s.activeChangeId);
  const changes = useShallowChanges();

  return useMemo(() => {
    return activeChangeId ? changes[activeChangeId] : null;
  }, [activeChangeId, changes]);
}
