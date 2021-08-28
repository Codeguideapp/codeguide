import {
  createCommands,
  createYText,
  diff,
  executeCommands,
  sync,
} from './edits';

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
  const oldStr = `const renderApp = () =>
  ReactDOM.render(
    <React.StrictMode>
      <div>
        <Editor />
        <App />
      </div>
    </React.StrictMode>,
  document.getElementById('root')
  )`;
  const newStr = `const renderApp = () =>
  ReactDOM.render(
    <React.StrictMode>
      <span>
        <App />
      </span>
    </React.StrictMode>,
  document.getElementById('something w')
  )
  // new line`;

  test('should diff strings and create changes', () => {
    const changes = diff(oldStr, newStr);
    const commands = createCommands(changes);
    const res = executeCommands(commands, oldStr);

    expect(res.toString()).toBe(newStr);
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

    const changes = diff(oldStr, newStr);
    const commands = shuffleArray(createCommands(changes));
    const res = executeCommands(commands, oldStr);

    expect(res.toString()).toBe(newStr);
  });
});
