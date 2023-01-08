import Link from 'next/link';
import { useState } from 'react';

export default function Page() {
  const [pricing, setPricing] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <div>
      <section
        style={{
          background: 'linear-gradient(45deg, #4489c1 0%, #8124b3 100%)',
        }}
      >
        <header aria-label="Site Header">
          <div className="mx-auto max-w-screen-lg px-12 mb-10">
            <div className="flex h-16 items-center justify-between">
              <div className="flex-1 md:flex md:items-center md:gap-12">
                <Link
                  className="flex text-white items-center gap-2 font-bold text-base hover:text-white"
                  href="/"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 512 512"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clip-path="url(#clip0_1_5)">
                      <path
                        d="M243.8 339.8C232.9 350.7 215.1 350.7 204.2 339.8L140.2 275.8C129.3 264.9 129.3 247.1 140.2 236.2C151.1 225.3 168.9 225.3 179.8 236.2L224 280.4L332.2 172.2C343.1 161.3 360.9 161.3 371.8 172.2C382.7 183.1 382.7 200.9 371.8 211.8L243.8 339.8ZM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256ZM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48Z"
                        fill="white"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_1_5">
                        <rect width="512" height="512" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <span>
                    <span className="text-gray-300">code</span>
                    <span className="">guide</span>
                  </span>
                </Link>
              </div>

              <div className="md:flex md:items-center md:gap-12">
                <nav aria-label="Site Nav" className="hidden md:block">
                  <ul className="flex items-center gap-6 text-sm">
                    <li>
                      <Link
                        className="transition text-white hover:text-white/75"
                        href="/#features"
                      >
                        Features
                      </Link>
                    </li>

                    <li>
                      <Link
                        className="transition text-white hover:text-white/75"
                        href="/#pricing"
                      >
                        Pricing
                      </Link>
                    </li>

                    <li>
                      <Link
                        className="transition text-white hover:text-white/75"
                        href="/#faq"
                      >
                        FAQ
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </header>

        <div className="px-12 mx-auto max-w-7xl">
          <div className="w-full py-6 mx-auto text-left md:w-11/12 xl:w-9/12 md:text-center">
            <h1 className="font-catamaran mb-8 text-3xl font-extrabold leading-none tracking-normal text-white md:text-5xl md:tracking-tight">
              Privacy policy
            </h1>
          </div>
          <div className="w-full mx-auto mt-14 text-center md:w-4/6"></div>
        </div>
      </section>

      <section>
        <div className="flow-root max-w-3xl m-auto px-8">
          <div className="py-4">
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              Codeguide is committed to protecting the privacy of its users.
              This privacy policy explains how Codeguide collects, uses, and
              shares information about you when you use our application.
            </p>

            <div className="flex items-center mt-4">
              <h3 className="text-lg font-bold text-black">
                Information We Collect and How We Use It
              </h3>
            </div>

            <p className="text-lg mt-2 leading-relaxed text-gray-700">
              We collect and store only the email address of our users to
              determine the access for guides. In the case of onboarding guides,
              we collect and store line and column numbers for the purpose of
              highlighting code. In the case of code reviews, we collect and
              store code &quot;deltas&quot;, or the parts of code that are added
              or deleted.
            </p>

            <div className="flex items-center mt-4">
              <h3 className="text-lg font-bold text-black">
                Sharing Your Information
              </h3>
            </div>

            <p className="text-lg mt-2 leading-relaxed text-gray-700">
              We will only share your information with third parties in the
              following circumstances:
            </p>
            <ul className="list-disc ml-8 mt-2 text-lg leading-relaxed text-gray-700">
              <li>
                In response to a request for information if we believe
                disclosure is in accordance with, or required by, any applicable
                law, regulation, legal process, or governmental request.
              </li>
              <li>
                If we believe your actions are inconsistent with the spirit or
                language of our terms of use or policies, or to protect the
                rights, property, and safety of Codeguide or others.
              </li>
              <li>
                In connection with, or during negotiations of, any merger, sale
                of company assets, financing, or acquisition of all or a portion
                of our business to another company.
              </li>
            </ul>
            <p className="text-lg mt-2 leading-relaxed text-gray-700">
              For private repositories, users of Codeguide must log in with
              their GitHub account and will only have access to repository data
              to which they have access on GitHub.
            </p>

            <div className="flex items-center mt-4">
              <h3 className="text-lg font-bold text-black">Data Retention</h3>
            </div>

            <p className="text-lg mt-2 leading-relaxed text-gray-700">
              We will retain your information for as long as your account is
              active or as needed to provide you the Services. We will retain
              and use your information as necessary to comply with our legal
              obligations, resolve disputes, and enforce our agreements.
            </p>
            <div className="flex items-center mt-4">
              <h3 className="text-lg font-bold text-black">
                Your Rights and Choices
              </h3>
            </div>
            <p className="text-lg mt-2 leading-relaxed text-gray-700">
              You have certain rights in relation to your personal information,
              including the right to request access, correction, erasure,
              restriction, transfer, to object to processing, to withdraw
              consent, and to opt out of the sale of your personal information.
              Not all of these rights apply in all circumstances, and we may
              need to retain certain information for legitimate business or
              legal purposes.
            </p>
            <p className="text-lg mt-2 leading-relaxed text-gray-700">
              You may exercise these rights by contacting us using the contact
              information provided below.
            </p>
            <p className="text-lg mt-2 leading-relaxed text-gray-700">
              You can also control cookies and tracking tools. Most web browsers
              are set to accept cookies by default. If you prefer, you can
              usually choose to set your browser to remove or reject cookies.
              Please note that if you choose to remove or reject cookies, this
              could affect the availability and functionality of the Services.
            </p>
          </div>
        </div>
      </section>

      <footer aria-label="Site Footer" className="bg-white">
        <div className="max-w-screen-xl px-4 pb-8 mx-auto sm:px-6 lg:px-8">
          <div className="pt-8 mt-16 border-t border-gray-100 sm:flex sm:items-center sm:justify-between lg:mt-24">
            <nav aria-label="Footer Navigation - Support">
              <ul className="flex flex-wrap justify-center gap-4 text-xs lg:justify-end">
                <Link
                  href="/privacy"
                  className="text-gray-500 transition hover:opacity-75"
                >
                  Privacy Policy
                </Link>
              </ul>
            </nav>

            <ul className="flex justify-center gap-6 mt-8 sm:mt-0 lg:justify-end">
              <li>
                <a
                  href="/"
                  rel="noreferrer"
                  target="_blank"
                  className="text-gray-700 transition hover:opacity-75"
                >
                  <span className="sr-only">GitHub</span>

                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
