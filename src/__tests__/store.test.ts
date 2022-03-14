import Delta from 'quill-delta';
import { useStore } from '../store/store';

// 1, 2, 3 insert, shuffle
// 1, 2 delete, 3 insert, shuffle
// 1, 2 enter - 2 iza 1
// 1, 2, 3 iza 1 i 2 (dve dependencia)

describe('store', () => {
  const initialStoreState = useStore.getState();

  beforeEach(() => {
    useStore.setState(initialStoreState, true);
  });

  it('should', async () => {
    useStore.getState().updateStore((state) => {
      state.playHeadX = 120;
    });

    useStore.getState().updateStore((state) => {
      const delta = new Delta();
      state.changes.draft.delta = delta.retain(247).insert('1');
    });

    useStore.getState().changes.draft.actions.saveChanges.callback();

    useStore.getState().updateStore((state) => {
      state.playHeadX = 200;
    });

    expect(useStore.getState().activeChangeValue).toBe(`
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
});
