// eslint-disable-next-line simple-import-sort/imports
import 'antd/dist/antd.dark.css';
import '../styles/globals.css';
import '../components/Steps/Steps.css';
import '../components/BottomBar/BottomBar.css';
import 'highlight.js/styles/github-dark.css';
// The following import prevents a Font Awesome icon server-side rendering bug,
// where the icons flash from a very large icon down to a properly sized one:
import '@fortawesome/fontawesome-svg-core/styles.css';
// Prevent fontawesome from adding its CSS since we did it manually above:
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false; /* eslint-disable import/first */

import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';

import { api } from '../utils/api';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default api.withTRPC(MyApp);
