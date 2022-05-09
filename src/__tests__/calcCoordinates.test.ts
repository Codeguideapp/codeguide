import Delta from 'quill-delta';

import { calcCoordinates } from '../atoms/saveDeltaAtom';

describe('calcCoordinates', () => {
  it('should calc coordinates', () => {
    const res1 = calcCoordinates([
      {
        id: '1',
        delta: new Delta().insert('\t2\n\t3\n'),
      },
    ]);

    expect(res1).toEqual([{ id: '1', from: 0, to: 6, op: 'insert' }]);

    const res2 = calcCoordinates([
      {
        id: '1',
        delta: new Delta().insert('\t2\n\t3\n'),
      },
      {
        id: '2',
        delta: new Delta().insert('111\n'),
      },
    ]);

    expect(res2).toEqual([
      { id: '1', from: 0, to: 6, op: 'insert' },
      { id: '2', from: 0, to: 4, op: 'insert' },
    ]);

    const res3 = calcCoordinates([
      {
        id: '1',
        delta: new Delta().insert('\t2\n\t3\n'),
      },
      {
        id: '2',
        delta: new Delta().insert('111\n'),
      },
      {
        id: '3',
        delta: new Delta().retain(4).insert('\t').retain(3).insert('\t'),
      },
    ]);

    expect(res3).toEqual([
      { id: '1', from: 0, to: 6, op: 'insert' },
      { id: '2', from: 0, to: 4, op: 'insert' },
      { id: '3', from: 4, to: 5, op: 'insert' },
      { id: '3', from: 7, to: 8, op: 'insert' },
    ]);
  });
});
