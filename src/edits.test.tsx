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

test('should diff', () => {
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

  const changes = diff(oldStr, newStr);
  const commands = createCommands(changes);
  const res = executeCommands(commands, oldStr);

  expect(res.toString()).toBe(newStr);
});
