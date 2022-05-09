import { difference } from 'lodash';
import Delta from 'quill-delta';

import { Change } from '../atoms/types';
import { deltaToString } from './deltaUtils';

export function getFileContent(params: {
  changeId: string;
  changesOrder: string[];
  changes: Record<string, Change>;
}) {
  const deltas = getDeltas(params).map((d) => d.delta);
  return deltaToString(deltas);
}

export function getDeltas({
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

  const deltas: {
    id: string;
    delta: Delta;
  }[] = [];
  const appliedSoFar: string[] = [];

  for (const changeId of changesOrder) {
    if (!changesIdsToApply.includes(changeId)) {
      continue;
    }

    let { delta, deps } = changes[changeId];
    const addedIds = difference(appliedSoFar, deps);

    for (const id of addedIds) {
      const index = appliedSoFar.indexOf(id);
      const addedDelta = deltas[index].delta;
      delta = addedDelta.transform(delta);
    }

    deltas.push({ id: changeId, delta });
    appliedSoFar.push(changeId);
  }

  return deltas;
}
