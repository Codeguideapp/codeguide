import {
  createCommands,
  createYText,
  diff,
  executeCommands,
  sync,
} from '../edits';
import { diffs } from './fixtures/diffs';

test('should apply independent edits', () => {
  const initial = createYText('example text');
  expect(initial.toString()).toBe('example text');

  const text1 = createYText(initial);
  const text2 = createYText(initial);

  text1.insert(0, '1');
  text2.insert(8, '2');

  expect(text1.toString()).toBe('1example text');
  expect(text2.toString()).toBe('example 2text');

  sync(text1, text2);

  expect(text1.toString()).toBe('1example 2text');
  expect(text2.toString()).toBe('1example 2text');
});

describe('diff', () => {
  for (const { oldVal, newVal } of diffs) {
    test('should diff strings and create changes', () => {
      const changes = diff(oldVal, newVal);
      const commands = createCommands(changes);
      const res = executeCommands(commands, oldVal);

      expect(res.toString()).toBe(newVal);
    });

    test('should work with randomised commands', () => {
      const shuffleArray = <T extends any>(array: T[]): T[] => {
        const cloned = [...array];

        for (let i = cloned.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
        }

        return cloned;
      };

      const changes = diff(oldVal, newVal);
      const commands = shuffleArray(createCommands(changes));
      const res = executeCommands(commands, oldVal);

      expect(res.toString()).toBe(newVal);
    });
  }
});
