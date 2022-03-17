import { createCommands, diff } from '../edits';

export type File = {
  path: string;
  oldVal: string;
  newVal: string;
};

export const getFile = async (path: string) => {
  // note: this can be invoked as user types, so it needs a caching layer
  const files = await getFiles(0);
  return files.find((f) => f.path === path);
};

export const getFiles = async (pr: number): Promise<File[]> => {
  return [
    {
      path: 'test.ts',
      oldVal: `
      const renderApp = () =>
        ReactDOM.render(
          <React.StrictMode>
            <div>
              <Editor />
              <App />
            </div>
          </React.StrictMode>,
        document.getElementById('root')
      )
      `,
      newVal: `bla
      const renderApp = () =>
        RaaeactDOM.render(
          <React.StrictMode>
            <div>
              <Editor />
              <App />
            </div>
          </React.StrictMode>,
        document.getElementById('root')
      )
      `,
    },
    {
      path: 'test2.ts',
      oldVal: `protected _createMouseTarget(e: EditorMouseEvent, testEventTarget: boolean): IMouseTarget {
          return this.mouseTargetFactory.createMouseTarget(this.viewHelper.getLastRenderData(), e.editorPos, e.pos, testEventTarget ? e.target : null);
        }`,
      newVal: `protected _createMouseTarget(e: EditorMouseEvent, testEventTarget: boolean): IMouseTarget {
          let target = e.target;
          if (!this.viewHelper.viewDomNode.contains(target)) {
            const shadowRoot = dom.getShadowRoot(this.viewHelper.viewDomNode);
            if (shadowRoot) {
              target = (<any>shadowRoot).elementsFromPoint(e.posx, e.posy).find(
                (el: Element) => this.viewHelper.viewDomNode.contains(el)
              );
            }
          }
          return this.mouseTargetFactory.createMouseTarget(this.viewHelper.getLastRenderData(), e.editorPos, e.pos, testEventTarget ? target : null);
        }`,
    },
  ];
};

export async function getSuggestions(oldVal: string, newVal: string) {
  return createCommands(diff(oldVal, newVal));
}
