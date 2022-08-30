import Delta from 'quill-delta';

import { Change } from '../atoms/changes';

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

export function getDeltaPreview(delta: Delta, fileVal: string, eol: string) {
  const preview: Record<
    number,
    {
      isDelete: boolean;
      code: string;
    }[]
  > = {};

  let index = 0;
  for (const op of delta.ops) {
    if (op.retain !== undefined) {
      index += op.retain;
    } else {
      let value =
        typeof op.insert === 'string'
          ? op.insert
          : op.delete !== undefined
          ? fileVal.slice(index, index + op.delete)
          : '';

      const startLineNum = getLineNum(index, fileVal, eol);
      const endLineNum = startLineNum + value.split(eol).length - 1;
      const valueSplitted = value.split(eol);

      for (let lineNum = startLineNum; lineNum <= endLineNum; lineNum++) {
        let lineContent = valueSplitted[lineNum - startLineNum];
        if (!lineContent) {
          lineContent = '\\n';
        }

        if (value.match(/^ +$/)) {
          value = '[whitespace]';
        }

        let code = lineContent;

        if (!preview[lineNum]) {
          preview[lineNum] = [];
        }
        preview[lineNum].push({ isDelete: op.delete !== undefined, code });
      }
    }
  }
  const previewLines = Object.keys(preview);
  if (previewLines.length > 3) {
    const toRemove = previewLines.splice(2, previewLines.length - 3);
    for (const line of toRemove) {
      delete preview[Number(line)];
    }
  }

  return preview;
}

function getLineNum(index: number, modifiedValue: string, eol: string): number {
  return modifiedValue.slice(0, index).split(eol).length;
}
