import { Popconfirm } from 'antd';
import Link from 'next/link';
import Moment from 'react-moment';

import { Footer } from '../components/LandingPage/Footer';
import { Header } from '../components/LandingPage/Header';
import { api } from '../utils/api';

export default function Dashboard() {
  const { isFetching, data, error, refetch } = api.guide.getUserGuides.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

  const { mutate } = api.guide.deleteGuide.useMutation({
    onSuccess: () => {
      refetch();
    },
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
              {isFetching ? (
                <div>Loading...</div>
              ) : (
                data?.map((guide) => (
                  <div
                    key={guide.id}
                    className="my-2 flex w-full justify-around gap-6 rounded-lg bg-opacity-20 p-2 hover:bg-purple-800"
                  >
                    <Moment className="w-28 opacity-80" fromNow>
                      {guide.createdAt}
                    </Moment>
                    <Link
                      href={`/${guide.id}`}
                      className="grow hover:text-neutral-200"
                    >
                      <div>
                        {guide.owner}/{guide.repository}
                        {guide.prNum ? `#${guide.prNum}` : ''}
                      </div>
                    </Link>
                    <Popconfirm
                      onConfirm={() => {
                        mutate({ id: guide.id });
                      }}
                      title="Are you sure you want to delete this guide?"
                    >
                      <div className="cursor-pointer hover:text-neutral-200">
                        delete
                      </div>
                    </Popconfirm>
                  </div>
                ))
              )}
            </div>
            {data?.length === 0 && <div>No guides found</div>}
            {error && <div>{error.message}</div>}
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
