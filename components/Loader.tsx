/* eslint-disable no-restricted-globals */
//import '@fontsource/inconsolata';
//import '@fontsource/roboto';

// eslint-disable-next-line simple-import-sort/imports
import * as monaco from 'monaco-editor';
import * as Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind'; // must be imported after Mousetrap
import React, { useEffect, useState } from 'react';

import { darkTheme, darkThemeInvertedDif } from './Editor/monaco-themes/dark';
import { App } from './App';
import { init } from './utils/init';
import { AccessDenied } from './indexAccessDenied';
import { GuideNotFound } from './indexGuideNotFound';
import { Loading } from './indexLoading';
import { InternalError } from './indexInternalError';
import { useFilesStore } from './store/files';

monaco.editor.defineTheme('darkInvertedDiff', darkThemeInvertedDif);
monaco.editor.defineTheme('darkTheme', darkTheme);

export default function Loader() {
  const undraftActiveFile = useFilesStore((s) => s.undraftActiveFile);
  const [repoApiStatus, setRepoApiStatus] = useState({
    isLoading: true,
    shouldTryLogin: false,
    errorStatus: 0,
  });

  useEffect(() => {
    init().then((res) => setRepoApiStatus(res));
  }, []);

  useEffect(() => {
    Mousetrap.bindGlobal(['command+s', 'ctrl+s'], function (e) {
      e?.preventDefault();

      undraftActiveFile();
    });
  }, [undraftActiveFile]);

  if (repoApiStatus.isLoading) return <Loading />;
  if (repoApiStatus.shouldTryLogin) return <AccessDenied />;
  if (repoApiStatus.errorStatus === 404) return <GuideNotFound />;
  if (repoApiStatus.errorStatus !== 0 && repoApiStatus.errorStatus !== 404)
    return <InternalError />;

  return <App />;
}
