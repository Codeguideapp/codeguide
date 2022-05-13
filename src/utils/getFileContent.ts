import { Change } from '../atoms/types';
import { deltaToString } from './deltaUtils';

export function getFileContent({
  upToChangeId,
  changesOrder,
  changes,
}: {
  upToChangeId: string;
  changesOrder: string[];
  changes: Record<string, Change>;
}) {
  const change = changes[upToChangeId];
  if (!change) throw new Error('change not found');

  const pathFilteredIds = changesOrder.filter(
    (id) => changes[id].path === change.path
  );
  const changesIdsToApply = pathFilteredIds.slice(
    0,
    pathFilteredIds.indexOf(change.id) + 1
  );

  return deltaToString(changesIdsToApply.map((id) => changes[id].delta));
}
