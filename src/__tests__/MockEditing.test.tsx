/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import { Provider } from 'jotai';
import { last } from 'lodash';
import Delta from 'quill-delta';

import { mockFiles } from '../__mocks__/mockFiles';
import { Changes } from '../atoms/types';
import { getFileContent } from '../utils/getFileContent';
import { MockEditing } from './MockEditing';

describe('changes atoms', () => {
  it('should correctly add a single char', () => {
    const { changes, changesOrder } = executeChanges({
      activeFile: 'old-tests.ts',
      edits: [
        {
          deltas: [new Delta().retain(247).insert('1')],
        },
      ],
    });

    const content = getFileContent({
      changes,
      changesOrder,
      changeId: changesOrder[changesOrder.length - 1],
    });

    expect(content).toBe(`
      const renderApp = () =>
        ReactDOM.render(
          <React.StrictMode>
            <div>
              <Editor />
              <App />
            </div>
          </React.StrictMode>,
        document.getElementById('root')
      )1
      `);
  });

  it('should correctly add multiple chars', () => {
    const { changes, changesOrder } = executeChanges({
      activeFile: 'old-tests.ts',
      edits: [
        { deltas: [new Delta().retain(247).insert('1')] },
        { deltas: [new Delta().retain(237).insert('2')] },
        { deltas: [new Delta().retain(249).insert('3')] },
      ],
    });

    const content = getFileContent({
      changes,
      changesOrder,
      changeId: changesOrder[changesOrder.length - 1],
    });

    expect(content).toBe(`
      const renderApp = () =>
        ReactDOM.render(
          <React.StrictMode>
            <div>
              <Editor />
              <App />
            </div>
          </React.StrictMode>,
        document.getElementById('root2')
      )13
      `);
  });

  it('should correctly move changes', () => {
    const res1 = executeChanges({
      activeFile: 'old-tests.ts',
      edits: [
        { deltas: [new Delta().retain(247).insert('1')] },
        { deltas: [new Delta().retain(237).insert('2')] },
        { deltas: [new Delta().retain(249).insert('3')] },
      ],
    });

    const content = getFileContent({
      changes: res1.changes,
      changesOrder: res1.changesOrder,
      changeId: last(res1.changesOrder)!,
    });

    expect(content).toBe(`
      const renderApp = () =>
        ReactDOM.render(
          <React.StrictMode>
            <div>
              <Editor />
              <App />
            </div>
          </React.StrictMode>,
        document.getElementById('root2')
      )13
      `);

    const res2 = executeChanges({
      activeFile: 'old-tests.ts',
      edits: [
        {
          deltas: [],
          swap: {
            from: res1.changesOrder[1],
            to: res1.changesOrder[2],
          },
        },
      ],
      renderFn: res1.render,
    });

    const content2 = getFileContent({
      changes: res2.changes,
      changesOrder: res2.changesOrder,
      changeId: last(res2.changesOrder)!,
    });
    expect(content2).toEqual(content);
  });

  it('should work with deletion', () => {
    const res = executeChanges({
      activeFile: 'old-tests.ts',
      edits: [
        { deltas: [new Delta().retain(247).insert('1')] },
        { deltas: [new Delta().retain(236).delete(1)] },
        { deltas: [new Delta().retain(247).insert('3')] },
      ],
    });

    const content = getFileContent({
      changes: res.changes,
      changesOrder: res.changesOrder,
      changeId: last(res.changesOrder)!,
    });

    expect(content).toBe(`
      const renderApp = () =>
        ReactDOM.render(
          <React.StrictMode>
            <div>
              <Editor />
              <App />
            </div>
          </React.StrictMode>,
        document.getElementById('roo')
      )13
      `);
  });

  it('should wrap and indent', () => {
    const { changes, changesOrder, file } = executeChanges({
      activeFile: 'indent-spaces.ts',
      edits: [
        { deltas: [new Delta().retain(2).insert(`{examplesSelect || (\n`)] },
        {
          deltas: [
            new Delta().retain(23).insert('  '),
            new Delta().retain(60).insert('  '),
            new Delta().retain(72).insert('  '),
            new Delta().retain(83).insert('  '),
          ],
        },
        { deltas: [new Delta().retain(93).insert(')}\n')] },
      ],
    });

    const content = getFileContent({
      changes,
      changesOrder,
      changeId: changesOrder[changesOrder.length - 1],
    });

    expect(content).toBe(file.newVal);
  });

  it('should wrap and indent and move', () => {
    const res1 = executeChanges({
      activeFile: 'indent-tabs.ts',
      edits: [
        { deltas: [new Delta().retain(2).insert(`{examplesSelect || (\n`)] },
        {
          deltas: [
            new Delta().retain(23).insert('\t\t'),
            new Delta().retain(30).insert('\t\t'),
            new Delta().retain(38).insert('\t\t'),
            new Delta().retain(46).insert('\t\t'),
          ],
        },
        { deltas: [new Delta().retain(54).insert(`)}\n`)] },
      ],
    });

    const content = getFileContent({
      changes: res1.changes,
      changesOrder: res1.changesOrder,
      changeId: last(res1.changesOrder)!,
    });

    expect(content).toBe(res1.file.newVal);

    const swap1 = executeChanges({
      activeFile: 'indent-tabs.ts',
      edits: [
        {
          deltas: [],
          swap: {
            from: res1.changesOrder[3],
            to: res1.changesOrder[2],
          },
        },
      ],
      renderFn: res1.render,
    });

    const swap1Content = getFileContent({
      changes: swap1.changes,
      changesOrder: swap1.changesOrder,
      changeId: last(swap1.changesOrder)!,
    });

    expect(content).toEqual(swap1Content);

    const swap2 = executeChanges({
      activeFile: 'indent-tabs.ts',
      edits: [
        {
          deltas: [],
          swap: {
            from: swap1.changesOrder[2],
            to: swap1.changesOrder[1],
          },
        },
      ],
      renderFn: res1.render,
    });

    const swap2Content = getFileContent({
      changes: swap2.changes,
      changesOrder: swap2.changesOrder,
      changeId: last(swap2.changesOrder)!,
    });

    expect(content).toEqual(swap2Content);
  });
});

function executeChanges({
  activeFile,
  edits,
  renderFn,
}: {
  activeFile: string;
  edits: {
    deltas: Delta[];
    swap?: {
      from: string;
      to: string;
    };
  }[];
  renderFn?: any;
}) {
  const wrapper = ({ children }: any) => <Provider>{children}</Provider>;
  const file = mockFiles.find((f) => f.path === activeFile);
  if (!file) {
    throw new Error('file not found');
  }

  let changes: Changes = {};
  let changesOrder: string[] = [];

  const changesUpdateHandler = (c: Changes) => (changes = c);
  const changesOrderUpdateHandler = (c: string[]) => (changesOrder = c);

  if (!renderFn) {
    const { rerender } = render(
      <MockEditing
        files={mockFiles}
        activeFile={activeFile}
        deltas={[]}
        onChangesUpdate={changesUpdateHandler}
        onChangesOrderUpdate={changesOrderUpdateHandler}
      />,
      { wrapper }
    );
    renderFn = rerender;
  }

  for (const edit of edits) {
    renderFn(
      <MockEditing
        files={mockFiles}
        activeFile={activeFile}
        deltas={edit.deltas}
        changesToSwap={edit.swap}
        onChangesUpdate={changesUpdateHandler}
        onChangesOrderUpdate={changesOrderUpdateHandler}
      />
    );
  }

  return {
    file,
    changes,
    changesOrder,
    render: renderFn,
  };
}
