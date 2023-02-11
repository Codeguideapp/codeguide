// eslint-disable-next-line simple-import-sort/imports
import 'antd/dist/antd.dark.css';
import '../styles/globals.css';
import '../components/Steps/Steps.css';
import '../components/BottomBar/BottomBar.css';
import 'highlight.js/styles/github-dark.css';

import { api } from '../utils/api';

import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default api.withTRPC(MyApp);
