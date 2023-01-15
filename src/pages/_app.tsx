// eslint-disable-next-line simple-import-sort/imports
import 'antd/dist/antd.dark.css';
import '../styles/globals.css';
import '../components/Guide/Guide.css';
import '../components/BottomBar/BottomBar.css';
import 'highlight.js/styles/github-dark.css';

import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}