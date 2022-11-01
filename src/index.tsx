/* eslint-disable no-restricted-globals */
// eslint-disable-next-line simple-import-sort/imports
import './index.css';
import 'antd/dist/antd.dark.css';
import '@fontsource/inconsolata';
import '@fontsource/roboto';

import { useAtom } from 'jotai';
import { debounce } from 'lodash';
import * as monaco from 'monaco-editor';
import * as Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind'; // must be imported after Mousetrap
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

import { saveActiveFileAtom } from './atoms/files';
import { windowHeightAtom, windowWidthAtom } from './atoms/layout';
import { darkTheme, darkThemeInvertedDif } from './Editor/monaco-themes/dark';
import { App } from './App';
import { initAtom, repoApiStatusAtom } from './atoms/init';
import { login } from './login';

function Loader() {
  const [, setWindowHeight] = useAtom(windowHeightAtom);
  const [, setWindowWidth] = useAtom(windowWidthAtom);
  const [, saveActiveFile] = useAtom(saveActiveFileAtom);
  const [, init] = useAtom(initAtom);
  const [repoApiStatus] = useAtom(repoApiStatusAtom);

  useEffect(() => {
    Mousetrap.bindGlobal(['command+s', 'ctrl+s'], function (e) {
      e?.preventDefault();

      saveActiveFile();
    });
  }, [saveActiveFile]);

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
    init();
  }, [init]);

  if (repoApiStatus.shouldTryLogin) {
    return (
      <div>
        <div>GitHub fetch repository data failed</div>
        <div>
          Is it a private repo? Try{' '}
          <span style={{ fontWeight: 'bold' }} onClick={login}>
            log in with github
          </span>
        </div>
      </div>
    );
  }
  if (repoApiStatus.isError)
    return <div>GitHub fetch repository data failed</div>;

  if (repoApiStatus.isLoading) return <div>loading...</div>;

  return <App />;
}

const renderApp = () => {
  monaco.editor.defineTheme('darkInvertedDiff', darkThemeInvertedDif);
  monaco.editor.defineTheme('darkTheme', darkTheme);

  ReactDOM.render(
    <React.StrictMode>
      <Loader />
    </React.StrictMode>,
    document.getElementById('root')
  );
};

renderApp();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
