import './index.css';

import { useAtom } from 'jotai';
import { debounce } from 'lodash';
import type * as monaco from 'monaco-editor';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import Split from 'react-split';
import useSWR from 'swr';

import { getFiles } from './api/api';
import { addFileAtom } from './atoms/files';
import {
  layoutSplitRatioAtom,
  windowHeightAtom,
  windowWidthAtom,
} from './atoms/layout';
import { Editor } from './Editor/Editor';
import { defaultDarkTheme } from './Editor/monaco-themes/defaultDark';
import { readOnlyTheme } from './Editor/monaco-themes/readonly';
import { FileTree } from './FileTree/FileTree';
import reportWebVitals from './reportWebVitals';
import { Timeline } from './Timeline/Timeline';

function App() {
  const [, setlLayoutSplitRatio] = useAtom(layoutSplitRatioAtom);
  const [, setWindowHeight] = useAtom(windowHeightAtom);
  const [, setWindowWidth] = useAtom(windowWidthAtom);
  const [, addFile] = useAtom(addFileAtom);

  const { data, error } = useSWR('/0', (url) => getFiles(0));

  useEffect(() => {
    window.addEventListener(
      'resize',
      debounce(() => {
        setWindowWidth(window.innerHeight);
        setWindowHeight(window.innerWidth);
      }, 100)
    );
  }, [setWindowHeight, setWindowWidth]);

  useEffect(() => {
    if (!data) return;

    for (const file of data) {
      addFile(file);
    }
  }, [data, addFile]);

  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;

  return (
    <Split
      className="split"
      direction="vertical"
      gutterSize={2}
      snapOffset={10}
      style={{ height: '100%' }}
      sizes={[70, 30]}
      minSize={[100, 100]}
      onDrag={([top, bottom]) => {
        setlLayoutSplitRatio([bottom, top]);
      }}
    >
      <Split
        className="split-horiz"
        direction="horizontal"
        sizes={[20, 80]}
        gutterSize={2}
      >
        <FileTree />
        <div
          style={{
            overflow: 'hidden',
            width: '100%',
            height: '100%',
          }}
        >
          <Editor />
        </div>
      </Split>

      <Timeline />
    </Split>
  );
}

const renderApp = () => {
  window.monaco.editor.defineTheme('readonly', readOnlyTheme);
  window.monaco.editor.defineTheme('defaultDark', defaultDarkTheme);

  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
};
// to avoid dealing with monaco and webpack I am using amd version
// taken from https://github.com/microsoft/monaco-editor-samples/blob/main/browser-amd-editor/index.html
// monaco is loaded in index.html and monacoReady event is triggered when loaded
declare global {
  interface Window {
    monacoLoaded: boolean;
    monaco: typeof monaco;
  }
}
if (window.monacoLoaded) {
  renderApp();
} else {
  document.addEventListener('monacoReady', renderApp);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
