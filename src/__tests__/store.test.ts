import Delta from 'quill-delta';

import { useStore } from '../store/store';

describe('store.ts', () => {
  const DRAFT = 'draft';

  const getState = useStore.getState;
  const initialStoreState = getState();
  const saveDraft = (delta: Delta) => {
    getState().updateStore((state) => {
      state.changes.draft.delta = delta;
    });

    return getState().changes.draft.actions.saveChanges.callback();
  };

  beforeEach(() => {
    useStore.setState(initialStoreState, true);
  });

  it('should correctly add a single char', () => {
    saveDraft(new Delta().retain(247).insert('1'));

    expect(getState().activeChangeValue).toBe(`
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
    saveDraft(new Delta().retain(247).insert('1'));
    saveDraft(new Delta().retain(237).insert('2'));
    saveDraft(new Delta().retain(249).insert('3'));

    expect(getState().activeChangeValue).toBe(`
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
    const id1 = saveDraft(new Delta().retain(247).insert('1'));
    const id2 = saveDraft(new Delta().retain(237).insert('2'));
    const id3 = saveDraft(new Delta().retain(249).insert('3'));

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

    expect(getState().activeChangeValue).toBe(endResult);
    expect(getState().userDefinedOrder).toEqual(['bla', id2, id1, id3, DRAFT]);

    getState().updateChangesOrder(id2, id3);

    expect(getState().activeChangeValue).toBe(endResult);
    expect(getState().userDefinedOrder).toEqual(['bla', id1, id3, id2, DRAFT]);

    getState().updateChangesOrder(id2, id3);

    expect(getState().activeChangeValue).toBe(endResult);
    expect(getState().userDefinedOrder).toEqual(['bla', id1, id2, id3, DRAFT]);
  });

  it('should throw an error on incorrect change order', () => {
    const id1 = saveDraft(new Delta().retain(247).insert('1'));
    const id2 = saveDraft(new Delta().retain(248).insert('2'));

    expect(() => getState().updateChangesOrder(id1, id2)).toThrowError();
    expect(() => getState().updateChangesOrder(id2, id1)).toThrowError();
    expect(() => getState().updateChangesOrder(id1, DRAFT)).toThrowError();
    expect(() => getState().updateChangesOrder(id2, DRAFT)).toThrowError();
  });

  it('should work with deletion', () => {
    const id1 = saveDraft(new Delta().retain(247).insert('1'));
    const id2 = saveDraft(new Delta().retain(236).delete(1));
    const id3 = saveDraft(new Delta().retain(247).insert('3'));

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

    expect(getState().userDefinedOrder).toEqual(['bla', id1, id2, id3, DRAFT]);
    expect(getState().activeChangeValue).toBe(endResult);

    expect(() => getState().updateChangesOrder(id1, id3)).toThrowError();

    getState().updateChangesOrder(id1, id2);

    expect(getState().userDefinedOrder).toEqual(['bla', id2, id1, id3, DRAFT]);
    expect(getState().activeChangeValue).toBe(endResult);

    getState().updateChangesOrder(id2, id3);

    expect(getState().userDefinedOrder).toEqual(['bla', id1, id3, id2, DRAFT]);
    expect(getState().activeChangeValue).toBe(endResult);
  });

  it('should work with new lines', () => {
    const id1 = saveDraft(new Delta().retain(247).insert('1'));
    const id2 = saveDraft(new Delta().retain(239).insert('\n        '));
    const id3 = saveDraft(new Delta().retain(257).insert('3'));

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

    expect(getState().activeChangeValue).toBe(endResult);

    expect(() => getState().updateChangesOrder(id1, id3)).toThrowError();

    getState().updateChangesOrder(id1, id2);

    expect(getState().userDefinedOrder).toEqual(['bla', id2, id1, id3, DRAFT]);
    expect(getState().activeChangeValue).toBe(endResult);

    getState().updateChangesOrder(id2, id3);

    expect(getState().userDefinedOrder).toEqual(['bla', id1, id3, id2, DRAFT]);
    expect(getState().activeChangeValue).toBe(endResult);
  });

  it('should work with multiple deps', () => {
    const id1 = saveDraft(new Delta().retain(247).insert('1'));
    const id2 = saveDraft(new Delta().retain(237).insert('2'));
    const id3 = saveDraft(
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

    expect(getState().activeChangeValue).toBe(endResult);

    getState().updateChangesOrder(id1, id2);

    expect(getState().userDefinedOrder).toEqual(['bla', id2, id1, id3, DRAFT]);
    expect(getState().activeChangeValue).toBe(endResult);

    getState().updateChangesOrder(id1, id2);

    expect(getState().userDefinedOrder).toEqual(['bla', id1, id2, id3, DRAFT]);
    expect(getState().activeChangeValue).toBe(endResult);

    expect(() => getState().updateChangesOrder(id1, id3)).toThrowError();
    expect(() => getState().updateChangesOrder(id2, id3)).toThrowError();
    expect(() => getState().updateChangesOrder(id3, id1)).toThrowError();
    expect(() => getState().updateChangesOrder(id3, id2)).toThrowError();
  });
});
