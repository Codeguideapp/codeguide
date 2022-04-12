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
