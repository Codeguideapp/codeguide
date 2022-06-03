import Delta from 'quill-delta';

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

export function countLines(delta: Delta, value: string, eol: string): number {
  let index = 0;
  let lines = 0;
  for (const op of delta.ops) {
    if (op.retain !== undefined) {
      index += op.retain;
    }
    if (typeof op.insert === 'string') {
      lines += op.insert.split(eol).length;
    }
    if (op.delete) {
      const deletedVal = value.slice(index, index + op.delete);
      lines += deletedVal.split(eol).length;
      index += op.delete;
    }
  }

  return lines;
}
