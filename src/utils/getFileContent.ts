import { difference } from 'lodash';
import Delta from 'quill-delta';

import { Change } from '../atoms/types';
import { composeDeltas, deltaToString } from './deltaUtils';

export function getFileContent({
  changeId,
  changesOrder,
  changes,
}: {
  changeId: string;
  changesOrder: string[];
  changes: Record<string, Change>;
}) {
  const change = changes[changeId];
  if (!change) throw new Error('change not found');

  const pathFilteredIds = changesOrder.filter(
    (id) => changes[id].path === change.path
  );
  const changesIdsToApply = pathFilteredIds.slice(
    0,
    pathFilteredIds.indexOf(change.id) + 1
  );

  const deltas: Delta[] = [];
  const appliedSoFar: string[] = [];

  for (const changeId of changesOrder) {
    if (!changesIdsToApply.includes(changeId)) {
      continue;
    }

    let { delta, deps } = changes[changeId];
    const addedIds = difference(appliedSoFar, deps);
    const removedIds = difference(deps, appliedSoFar);

    if (addedIds.length) {
      const addedDelta = composeDeltas(addedIds.map((id) => changes[id].delta));

      delta = addedDelta.transform(delta);
    }

    if (removedIds.length) {
      const removedDelta = composeDeltas(
        removedIds.map((id) => changes[id].deltaInverted)
      );

      delta = delta.transform(removedDelta);
    }

    deltas.push(delta);
    appliedSoFar.push(changeId);
  }

  return deltaToString(deltas);
}
