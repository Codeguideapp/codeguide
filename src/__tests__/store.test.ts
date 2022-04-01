/**
 * @jest-environment jsdom
 */

import { last } from 'lodash';
import Delta from 'quill-delta';

import { getFiles } from '../api/api';
import { useStore } from '../store/store';

describe('store.ts', () => {
  const getState = useStore.getState;
  const initialStoreState = getState();

  const getLastChangeContent = () => {
    return getState().getFileContent(last(getState().userDefinedOrder)!);
  };

  beforeEach(async () => {
    useStore.setState(initialStoreState, true);
  });

  it('should correctly add a single char', async () => {
    const files = await getFiles(0);
    getState().addFile(files[0]);
    getState().setActivePath(files[0].path);

    const id = getState().saveChange(new Delta().retain(247).insert('1'));

    expect(getState().getFileContent(id)).toBe(`
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

  it('should correctly add multiple chars', async () => {
    const files = await getFiles(0);
    getState().addFile(files[0]);
    getState().setActivePath(files[0].path);

    getState().saveChange(new Delta().retain(247).insert('1'));
    getState().saveChange(new Delta().retain(237).insert('2'));
    const id = getState().saveChange(new Delta().retain(249).insert('3'));

    expect(getState().getFileContent(id)).toBe(`
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

  it('should correctly move changes', async () => {
    const files = await getFiles(0);
    const initId = getState().addFile(files[0]);
    getState().setActivePath(files[0].path);

    const id1 = getState().saveChange(new Delta().retain(247).insert('1'));
    const id2 = getState().saveChange(new Delta().retain(237).insert('2'));
    const id3 = getState().saveChange(new Delta().retain(249).insert('3'));

    const endResult = `
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
      `;

    getState().updateChangesOrder(id1, id2);

    expect(getState().userDefinedOrder).toEqual([initId, id2, id1, id3]);
    expect(getLastChangeContent()).toBe(endResult);

    getState().updateChangesOrder(id2, id3);

    expect(getState().userDefinedOrder).toEqual([initId, id1, id3, id2]);
    expect(getLastChangeContent()).toBe(endResult);

    getState().updateChangesOrder(id2, id3);

    expect(getState().userDefinedOrder).toEqual([initId, id1, id2, id3]);
    expect(getLastChangeContent()).toBe(endResult);
  });

  it('should throw an error on incorrect change order', async () => {
    const files = await getFiles(0);
    getState().addFile(files[0]);
    getState().setActivePath(files[0].path);

    const id1 = getState().saveChange(new Delta().retain(247).insert('1'));
    const id2 = getState().saveChange(new Delta().retain(248).insert('2'));

    expect(() => getState().updateChangesOrder(id1, id2)).toThrowError();
    expect(() => getState().updateChangesOrder(id2, id1)).toThrowError();
  });

  it('should work with deletion', async () => {
    const files = await getFiles(0);
    const initId = getState().addFile(files[0]);
    getState().setActivePath(files[0].path);

    const id1 = getState().saveChange(new Delta().retain(247).insert('1'));
    const id2 = getState().saveChange(new Delta().retain(236).delete(1));
    const id3 = getState().saveChange(new Delta().retain(247).insert('3'));

    const endResult = `
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
      `;

    expect(getState().userDefinedOrder).toEqual([initId, id1, id2, id3]);
    expect(getLastChangeContent()).toBe(endResult);

    expect(() => getState().updateChangesOrder(id1, id3)).toThrowError();

    getState().updateChangesOrder(id1, id2);

    expect(getState().userDefinedOrder).toEqual([initId, id2, id1, id3]);
    expect(getLastChangeContent()).toBe(endResult);

    getState().updateChangesOrder(id2, id3);

    expect(getState().userDefinedOrder).toEqual([initId, id1, id3, id2]);
    expect(getLastChangeContent()).toBe(endResult);
  });

  it('should work with new lines', async () => {
    const files = await getFiles(0);
    const initId = getState().addFile(files[0]);
    getState().setActivePath(files[0].path);

    const id1 = getState().saveChange(new Delta().retain(247).insert('1'));
    const id2 = getState().saveChange(
      new Delta().retain(239).insert('\n        ')
    );
    const id3 = getState().saveChange(new Delta().retain(257).insert('3'));

    const endResult = `
      const renderApp = () =>
        ReactDOM.render(
          <React.StrictMode>
            <div>
              <Editor />
              <App />
            </div>
          </React.StrictMode>,
        document.getElementById('root')
        
      )13
      `;

    expect(getLastChangeContent()).toBe(endResult);

    expect(() => getState().updateChangesOrder(id1, id3)).toThrowError();

    getState().updateChangesOrder(id1, id2);

    expect(getState().userDefinedOrder).toEqual([initId, id2, id1, id3]);
    expect(getLastChangeContent()).toBe(endResult);

    getState().updateChangesOrder(id2, id3);

    expect(getState().userDefinedOrder).toEqual([initId, id1, id3, id2]);
    expect(getLastChangeContent()).toBe(endResult);
  });

  it('should work with multiple deps', async () => {
    const files = await getFiles(0);
    const initId = getState().addFile(files[0]);
    getState().setActivePath(files[0].path);

    const id1 = getState().saveChange(new Delta().retain(247).insert('1'));
    const id2 = getState().saveChange(new Delta().retain(237).insert('2'));
    const id3 = getState().saveChange(
      new Delta().retain(238).insert('3').retain(11).insert('3')
    );

    const endResult = `
      const renderApp = () =>
        ReactDOM.render(
          <React.StrictMode>
            <div>
              <Editor />
              <App />
            </div>
          </React.StrictMode>,
        document.getElementById('root23')
      )13
      `;

    expect(getLastChangeContent()).toBe(endResult);

    getState().updateChangesOrder(id1, id2);

    expect(getState().userDefinedOrder).toEqual([initId, id2, id1, id3]);
    expect(getLastChangeContent()).toBe(endResult);

    getState().updateChangesOrder(id1, id2);

    expect(getState().userDefinedOrder).toEqual([initId, id1, id2, id3]);
    expect(getLastChangeContent()).toBe(endResult);

    expect(() => getState().updateChangesOrder(id1, id3)).toThrowError();
    expect(() => getState().updateChangesOrder(id2, id3)).toThrowError();
    expect(() => getState().updateChangesOrder(id3, id1)).toThrowError();
    expect(() => getState().updateChangesOrder(id3, id2)).toThrowError();
  });
});
