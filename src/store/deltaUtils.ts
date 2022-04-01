import Delta from 'quill-delta';

export function composeDeltas(deltas: Delta[]) {
  return deltas.reduce((acc, curr) => acc.compose(curr), new Delta());
}

export function deltaToString(deltas: Delta[], initial = '') {
  const composeAllDeltas = composeDeltas(deltas);
  return composeAllDeltas.reduce((text, op) => {
    if (!op.insert) return text;
    if (typeof op.insert !== 'string') return text + ' ';

    return text + op.insert;
  }, initial);
}

type Coordinate = {
  from: number;
  to: number;
  id: string;
  op: 'insert' | 'delete';
};

export function calcCoordinates(
  data: { delta: Delta; id: string }[]
): Coordinate[] {
  return data
    .map(({ delta, id }) => {
      let index = 0;
      return delta
        .map((op) => {
          if (op.retain) {
            index += op.retain;
            return null;
          } else if (op.delete) {
            return {
              id,
              from: index,
              to: index + op.delete,
              op: 'delete',
            };
          } else if (typeof op.insert === 'string') {
            return {
              id,
              from: index,
              to: index + op.insert.length,
              op: 'insert',
            };
          }
          return null;
        })
        .filter((op) => op !== null);
    })
    .flat() as Coordinate[];
}
