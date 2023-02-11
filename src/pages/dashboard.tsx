import Link from 'next/link';
import Moment from 'react-moment';

import { Footer } from '../components/LandingPage/Footer';
import { Header } from '../components/LandingPage/Header';
import { api } from '../utils/api';

export default function Dashboard() {
  const res = api.guide.getUserGuides.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: false,
  });

  return (
    <div
      style={{
        background: 'linear-gradient(45deg, #4489c1 0%, #8124b3 100%)',
      }}
    >
      <section className="min-h-screen">
        <Header />

        <div className="mx-auto max-w-7xl px-12">
          <div className="mx-auto w-full py-6 text-left md:w-11/12  xl:w-9/12">
            <h1 className="mb-4 font-catamaran text-xl font-extrabold leading-none tracking-normal text-white">
              Guides
            </h1>
            <div className="text-md py-4 text-left text-white">
              {res.isFetching ? (
                <div>Loading...</div>
              ) : (
                res.data?.map((guide) => (
                  <div key={guide.id}>
                    <Link
                      href={`/${guide.id}`}
                      className="hover:text-neutral-200"
                    >
                      <div className="my-2 flex gap-6">
                        <Moment className="opacity-80" fromNow>
                          {guide.createdAt}
                        </Moment>
                        <div>
                          {guide.owner}/{guide.repository}
                          {guide.prNum ? `#${guide.prNum}` : ''}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
            {res.error && <div>{res.error.message}</div>}
          </div>
          <div className="mx-auto mt-14 w-full text-center md:w-4/6"></div>
        </div>
      </section>

      <section>
        <div className="m-auto flow-root max-w-3xl px-8"></div>
      </section>

      <Footer />
    </div>
  );
}
