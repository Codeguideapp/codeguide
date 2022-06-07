import { Change } from '../atoms/types';
import { deltaToString } from './deltaUtils';

export function getFileContent({
  upToChangeId,
  changesOrder,
  changes,
  excludeChange,
}: {
  upToChangeId: string;
  changesOrder: string[];
  changes: Record<string, Change>;
  excludeChange?: boolean;
}) {
  const change = changes[upToChangeId];
  if (!change) throw new Error('change not found');

  const pathFilteredIds = changesOrder.filter(
    (id) => changes[id].path === change.path && changes[id].delta
  );
  const changesIdsToApply = pathFilteredIds.slice(
    0,
    pathFilteredIds.indexOf(change.id) + (excludeChange ? 0 : 1)
  );

  return deltaToString(changesIdsToApply.map((id) => changes[id].delta!));
}
