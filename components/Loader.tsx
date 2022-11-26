/* eslint-disable no-restricted-globals */
//import '@fontsource/inconsolata';
//import '@fontsource/roboto';

// eslint-disable-next-line simple-import-sort/imports
import { useAtom } from 'jotai';
import * as monaco from 'monaco-editor';
import * as Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind'; // must be imported after Mousetrap
import React, { useEffect } from 'react';

import { undraftActiveFileAtom } from './atoms/files';
import { darkTheme, darkThemeInvertedDif } from './Editor/monaco-themes/dark';
import { App } from './App';
import { initAtom, repoApiStatusAtom } from './atoms/init';
import { AccessDenied } from './indexAccessDenied';
import { GuideNotFound } from './indexGuideNotFound';
import { Loading } from './indexLoading';
import { InternalError } from './indexInternalError';

monaco.editor.defineTheme('darkInvertedDiff', darkThemeInvertedDif);
monaco.editor.defineTheme('darkTheme', darkTheme);

export default function Loader() {
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
    init();
  }, [init]);

  if (repoApiStatus.isLoading) return <Loading />;
  if (repoApiStatus.shouldTryLogin) return <AccessDenied />;
  if (repoApiStatus.errorStatus === 404) return <GuideNotFound />;
  if (repoApiStatus.errorStatus !== 0 && repoApiStatus.errorStatus !== 404)
    return <InternalError />;

  return <App />;
}
