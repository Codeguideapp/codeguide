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

import { undraftActiveFileAtom } from './atoms/files';
import { windowHeightAtom, windowWidthAtom } from './atoms/layout';
import { darkTheme, darkThemeInvertedDif } from './Editor/monaco-themes/dark';
import { App } from './App';
import { initAtom, repoApiStatusAtom } from './atoms/init';
import { AccessDenied } from './indexAccessDenied';
import { GuideNotFound } from './indexGuideNotFound';
import { Loading } from './indexLoading';

function Loader() {
  const [, setWindowHeight] = useAtom(windowHeightAtom);
  const [, setWindowWidth] = useAtom(windowWidthAtom);
  const [, undraftActiveFile] = useAtom(undraftActiveFileAtom);
  const [, init] = useAtom(initAtom);
  const [repoApiStatus] = useAtom(repoApiStatusAtom);

  useEffect(() => {
    Mousetrap.bindGlobal(['command+s', 'ctrl+s'], function (e) {
      e?.preventDefault();

      undraftActiveFile();
    });
  }, [undraftActiveFile]);

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

  if (repoApiStatus.shouldTryLogin) return <AccessDenied />;
  if (repoApiStatus.isError) return <GuideNotFound />;
  if (repoApiStatus.isLoading) return <Loading />;

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
