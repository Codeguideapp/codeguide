import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';

const Loader = dynamic(() => import('../../components/Loader'), {
  ssr: false,
});

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>CodeGuide</title>
      </Head>
      <Loader />
    </>
  );
};

export default Home;
