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
import { AccessDenied } from './indexAccessDenied';
import { GuideNotFound } from './indexGuideNotFound';
import { Loading } from './indexLoading';
import { InternalError } from './indexInternalError';
import { useFilesStore } from './store/files';
import { api } from '../utils/api';
import { useGuideStore } from './store/guide';
import { useChangesStore } from './store/changes';
import { useCommentsStore } from './store/comments';

monaco.editor.defineTheme('darkInvertedDiff', darkThemeInvertedDif);
monaco.editor.defineTheme('darkTheme', darkTheme);

export default function Loader() {
  const res = api.guide.getGuide.useQuery(
    {
      guideId: document.location.pathname.split('/')[1],
    },
    {
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

  const undraftActiveFile = useFilesStore((s) => s.undraftActiveFile);

  useEffect(() => {
    if (res.data && !useGuideStore.getState().id) {
      useGuideStore.getState().setGuide(res.data.guide);
      useChangesStore.getState().storeChangesFromServer(res.data.changes);
      useCommentsStore.getState().storeCommentsFromServer(res.data.comments);
    }
  }, [res.data]);

  useEffect(() => {
    Mousetrap.bindGlobal(['command+s', 'ctrl+s'], function (e) {
      e?.preventDefault();

      undraftActiveFile();
    });
  }, [undraftActiveFile]);

  if (res.isFetching) return <Loading />;
  if (res.error?.data?.code === 'FORBIDDEN') return <AccessDenied />;
  if (res.error?.data?.code === 'NOT_FOUND') return <GuideNotFound />;
  if (res.error) return <InternalError />;

  return <App />;
}
