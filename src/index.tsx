/* eslint-disable no-restricted-globals */
// eslint-disable-next-line simple-import-sort/imports
import './index.css';
import 'antd/dist/antd.dark.css';
import '@fontsource/inconsolata';
import '@fontsource/roboto';

import useSWR from 'swr';
import { useAtom } from 'jotai';
import { debounce } from 'lodash';
import * as monaco from 'monaco-editor';
import * as Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind'; // must be imported after Mousetrap
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import { saveActiveFileAtom } from './atoms/files';
import { windowHeightAtom, windowWidthAtom } from './atoms/layout';
import { darkTheme, darkThemeInvertedDif } from './Editor/monaco-themes/dark';
import { guideAtom } from './atoms/guide';
import { App } from './App';
import { checkToken, exchangeCodeForToken } from './login';
import { backendApi } from './config';

const guideId = document.location.pathname.split('/')[1];

function Loader() {
  const [, setGuide] = useAtom(guideAtom);
  const [, setWindowHeight] = useAtom(windowHeightAtom);
  const [, setWindowWidth] = useAtom(windowWidthAtom);
  const [, saveActiveFile] = useAtom(saveActiveFileAtom);
  const [isFetchingToken, setIsFetchingToken] = useState<boolean>(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(document.location.search);

    const params: any = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    if (params.code) {
      setIsFetchingToken(true);
      exchangeCodeForToken(params.code).then(() => setIsFetchingToken(false));
    } else {
      checkToken();
    }
  }, []);

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

  const res = useSWR(`${backendApi}/guide/${guideId}`, (url) =>
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response;
      })
      .then((res) => res.json())
  );

  useEffect(() => {
    if (res.data) {
      setGuide(res.data);
    }
  }, [setGuide, res.data]);

  if (res.error) return <div>failed to load</div>;
  if (!res.data || isFetchingToken) return <div>loading...</div>;

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
