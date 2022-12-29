import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

const Loader = dynamic(() => import('../../components/Loader'), {
  ssr: false,
});

const Home: NextPage = () => {
  return <Loader />;
};

export default Home;
