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
import { useStepsStore } from './store/steps';
import { useCommentsStore } from './store/comments';
import { useAtom } from 'jotai';
import { activeSectionAtom, isEditing } from './store/atoms';
import { EditAccessDenied } from './editAccessDenied';
import { useSession } from 'next-auth/react';

monaco.editor.defineTheme('darkInvertedDiff', darkThemeInvertedDif);
monaco.editor.defineTheme('darkTheme', darkTheme);

export default function Loader() {
  const [, setActiveSection] = useAtom(activeSectionAtom);
  const userSession = useSession();

  const res = api.guide.getGuide.useQuery(
    {
      guideId: document.location.pathname.split('/')[1],
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

  const email = userSession.data?.user.email;
  const undraftActiveFile = useFilesStore((s) => s.undraftActiveFile);

  useEffect(() => {
    if (res.data && !useGuideStore.getState().id) {
      useGuideStore.getState().setGuide(res.data.guide);
      Promise.all([
        useStepsStore.getState().storeStepsFromServer(res.data.changes),
        useCommentsStore.getState().storeCommentsFromServer(res.data.comments),
      ]).then(() => {
        useGuideStore.setState({ isFetching: false });
      });

      if (res.data.guide.type === 'browse') {
        setActiveSection('filesExplorer');
      }
    }
  }, [res.data, setActiveSection]);

  useEffect(() => {
    Mousetrap.bindGlobal(['command+s', 'ctrl+s'], function (e) {
      e?.preventDefault();

      undraftActiveFile();
    });
  }, [undraftActiveFile]);

  if (res.isFetching) return <Loading />;

  if (res.error?.data?.code === 'FORBIDDEN') return <AccessDenied />;

  if (isEditing() && !res.data?.guide.canEdit.includes(email || ''))
    return <EditAccessDenied />;

  if (res.error?.data?.code === 'NOT_FOUND') return <GuideNotFound />;
  if (res.error) return <InternalError />;

  return <App />;
}
