export const diffs = [
  {
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
