import Delta from 'quill-delta';

import { Step } from '../components/store/steps';

export function composeDeltas(deltas: Delta[]) {
  return deltas.reduce((acc, curr) => acc.compose(curr), new Delta());
}

export function deltaToString(deltas: Delta[]) {
  const composeAllDeltas = composeDeltas(deltas);
  return composeAllDeltas.reduce((text, op) => {
    if (!op.insert) return text;
    if (typeof op.insert !== 'string') return text + ' ';

    return text + op.insert;
  }, '');
}

export function getFileContent({
  upToStepId,
  changes,
  excludeChange,
}: {
  upToStepId: string;
  changes: Record<string, Step>;
  excludeChange?: boolean;
}) {
  const change = changes[upToStepId];
  if (!change) throw new Error('change not found');

  const changesOrder = Object.keys(changes).sort();

  const pathFilteredIds = changesOrder.filter(
    (id) => changes[id].path === change.path && changes[id].delta
  );
  const changesIdsToApply = pathFilteredIds.slice(
    0,
    pathFilteredIds.indexOf(change.id) + (excludeChange ? 0 : 1)
  );

  return deltaToString(changesIdsToApply.map((id) => changes[id].delta));
}

export function calcStat(delta: Delta): [number, number] {
  let inserts = 0;
  let deletes = 0;

  for (const op of delta.ops) {
    if (typeof op.insert === 'string') {
      inserts += op.insert.length;
    }
    if (op.delete) {
      deletes += op.delete;
    }
  }

  return [inserts, deletes];
}
