import Link from 'next/link';
import { useEffect } from 'react';

import { Footer } from '../components/LandingPage/Footer';
import { Header } from '../components/LandingPage/Header';

export default function Page() {
  return (
    <div>
      <section
        style={{
          background: 'linear-gradient(45deg, #4489c1 0%, #8124b3 100%)',
        }}
      >
        <Header />

        <div className="mx-auto max-w-7xl px-12">
          <div className="mx-auto w-full py-6 text-left md:w-11/12 md:text-center xl:w-9/12">
            <h1 className="mb-8 font-catamaran text-3xl font-extrabold leading-none tracking-normal text-white md:text-5xl md:tracking-tight">
              Contact us
            </h1>
          </div>
          <div className="mx-auto mt-14 w-full text-center md:w-4/6"></div>
        </div>
      </section>

      <section>
        <div className="m-auto flow-root max-w-3xl px-8">
          <div className="py-4">
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              For bug reports, please use{' '}
              <Link
                className=" text-blue-500"
                target={'_blank'}
                href="https://github.com/Codeguideapp/codeguide/issues"
              >
                Github issues
              </Link>
              .
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              For other inquiries, email us at{' '}
              <span
                className="hiddenmailto cursor-pointer text-blue-500"
                data-name="hello"
                data-domain="codeguide"
                data-tld="app"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.assign('mailto:hello@codeguide.app');
                  }
                }}
              ></span>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
