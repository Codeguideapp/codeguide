import './index.css';
import 'antd/dist/antd.dark.css';

import { useAtom } from 'jotai';
import { debounce } from 'lodash';
import * as monaco from 'monaco-editor';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import Split from 'react-split';

import { setFileChangesAtom } from './atoms/files';
import {
  layoutSplitRatioAtom,
  windowHeightAtom,
  windowWidthAtom,
} from './atoms/layout';
import { Editor } from './Editor/Editor';
import { defaultDarkTheme } from './Editor/monaco-themes/defaultDark';
import { FileTree } from './FileTree/FileTree';
import reportWebVitals from './reportWebVitals';
import { Timeline } from './Timeline/Timeline';

function App() {
  const [, setlLayoutSplitRatio] = useAtom(layoutSplitRatioAtom);
  const [, setWindowHeight] = useAtom(windowHeightAtom);
  const [, setWindowWidth] = useAtom(windowWidthAtom);
  const [, setFileChanges] = useAtom(setFileChangesAtom);

  useEffect(() => {
    window.addEventListener(
      'resize',
      debounce(() => {
        setWindowWidth(window.innerWidth);
        setWindowHeight(window.innerHeight);
      }, 100)
    );
  }, [setWindowHeight, setWindowWidth]);

  useEffect(() => {
    // initial
    setFileChanges(0);
  }, [setFileChanges]);

  return (
    <div className="main">
      <div className="top"></div>
      <Split
        className="split"
        direction="vertical"
        gutterSize={1}
        snapOffset={10}
        style={{ height: '100%' }}
        sizes={[65, 35]}
        minSize={[100, 100]}
        onDrag={([top, bottom]) => {
          setlLayoutSplitRatio([bottom, top]);
        }}
      >
        <Split
          className="split-horiz"
          direction="horizontal"
          sizes={[20, 80]}
          gutterSize={1}
        >
          <div className="main-left">
            <div className="left-menu"></div>
            <FileTree />
          </div>

          <Editor />
        </Split>

        <Timeline />
      </Split>
    </div>
  );
}

const renderApp = () => {
  monaco.editor.defineTheme('defaultDark', defaultDarkTheme);

  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
};

renderApp();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
