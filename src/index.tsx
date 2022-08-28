import './index.css';
import 'antd/dist/antd.dark.css';
import '@fontsource/inconsolata';
import '@fontsource/roboto';

import { useAtom } from 'jotai';
import { debounce } from 'lodash';
import * as monaco from 'monaco-editor';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import Split from 'react-split';

import { setFileChangesAtom } from './atoms/files';
import { windowHeightAtom, windowWidthAtom } from './atoms/layout';
import { Editor } from './Editor/Editor';
import {
  darkTheme,
  darkThemeInvertedDif,
} from './Editor/monaco-themes/defaultDark';
import { LeftSide } from './LeftSide/LeftSide';
import reportWebVitals from './reportWebVitals';

function App() {
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
      <Split
        className="split-horiz"
        direction="horizontal"
        sizes={[20, 80]}
        minSize={[300, 300]}
        gutterSize={1}
      >
        <LeftSide />
        <Editor />
      </Split>
    </div>
  );
}

const renderApp = () => {
  monaco.editor.defineTheme('darkInvertedDiff', darkThemeInvertedDif);
  monaco.editor.defineTheme('darkTheme', darkTheme);

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
