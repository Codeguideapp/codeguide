import { difference, findLast } from 'lodash';
import Delta from 'quill-delta';

import { getFiles } from '../api/api';
import { Change } from '../atoms/types';
import { composeDeltas, deltaToString } from './deltaUtils';

export async function getDiffByChangeId({
  activeChange,
  changesOrder,
  changes,
}: {
  activeChange: Change;
  changesOrder: string[];
  changes: Record<string, Change>;
}) {
  if (!activeChange) {
    throw new Error('invalid changeId');
  }

  const files = await getFiles(0);

  const file = files.find((f) => f.path === activeChange.path);
  if (!file) {
    throw new Error(`missing file for ${activeChange.path}`);
  }

  const previousChange = changesOrder
    .slice(0, changesOrder.indexOf(activeChange.id))
    .reverse()
    .map((id) => changes[id])
    .find((change) => change.path === activeChange.path);

  const before = previousChange
    ? getFileContent({
        change: previousChange,
        changes,
        changesOrder,
      })
    : '';
  const after = getFileContent({
    change: activeChange,
    changes,
    changesOrder,
  });

  return { before, after };
}

export async function getDiffByPath({
  path,
  changesOrder,
  changes,
}: {
  path: string;
  changesOrder: string[];
  changes: Record<string, Change>;
}) {
  const files = await getFiles(0);

  const file = files.find((f) => f.path === path);
  if (!file) {
    throw new Error(`missing file for ${path}`);
  }

  const previousChangeId = findLast(
    changesOrder,
    (id) => changes[id].path === path
  );

  const before = previousChangeId
    ? getFileContent({
        change: changes[previousChangeId],
        changes,
        changesOrder,
      })
    : file.oldVal;

  const after = file.newVal;

  return { before, after };
}

function getFileContent({
  change,
  changesOrder,
  changes,
}: {
  change: Change;
  changesOrder: string[];
  changes: Record<string, Change>;
}) {
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
