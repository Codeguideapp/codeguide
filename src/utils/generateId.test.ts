import { decodeTime } from 'ulid';

import { generateId } from './generateId';

describe('generateId', () => {
  test('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toEqual(id2);
  });

  test('generates IDs with increasing timestamps', () => {
    const id1 = generateId();
    const timestamp1 = decodeTime(id1);
    const id2 = generateId();
    const timestamp2 = decodeTime(id2);
    expect(timestamp2).toBeGreaterThan(timestamp1);
  });
});
