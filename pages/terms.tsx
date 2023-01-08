import Link from 'next/link';

export default function Page() {
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
              Terms of service
            </h1>
          </div>
          <div className="w-full mx-auto mt-14 text-center md:w-4/6"></div>
        </div>
      </section>

      <section>
        <div className="flow-root max-w-3xl m-auto px-8">
          <div className="py-4">
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                When we say &rdquo;company&rdquo;, &ldquo;we&rdquo;,
                &ldquo;our&rdquo;, &ldquo;us&rdquo;, &rdquo;service&rdquo; or
                &rdquo;services&rdquo; in this document, we are referring to
                Codeguide.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>Note</span>
              <span>
                : The following Terms of Service does not apply to Codeguide
                Self-Hosted version which would be hosted on your own servers
                and therefore the Terms of Service isn&rsquo;t needed.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                We may update these Terms of Service in the future. Whenever we
                make a significant change to our policies, we will also announce
                them.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                When you use our service, now or in the future, you are agreeing
                to the latest Terms of Service. That&rsquo;s true for any of our
                existing and future products and all features that we add to our
                service over time. There may be times where we do not exercise
                or enforce any right or provision of the Terms of Service; in
                doing so, we are not waiving that right or provision. These
                terms do contain a limitation of our liability.&nbsp;
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                If you do not agree to these Terms of Service, do not use this
                service. Violation of any of the terms below may result in the
                termination of your account.
              </span>
            </p>
            <h2 className="mt-4 text-lg font-bold text-black">
              <span>Account terms</span>
            </h2>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                You are responsible for maintaining the security of your
                account. Codeguide cannot and will not be liable for any loss or
                damage from your failure to comply with this security
                obligation.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                You are responsible for any activity that occurs under your
                account (even by others who have their own logins under your
                account).
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                You may not use our service for any illegal purpose or to
                violate any laws in your jurisdiction.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                You must be a human. Accounts registered by bots or other
                automated methods are not permitted.
              </span>
            </p>
            <h2 className="mt-4 text-lg font-bold text-black">
              <span>Payment, refunds terms</span>
            </h2>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                If you are upgrade to a paid plan, we will charge you
                immediately and your billing cycle starts on the day of upgrade.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                Paying customers are billed automatically via credit card or
                PayPal depending on their preference.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                There are no surprise fees and your card will never be charged
                unexpectedly.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                Cancelling your plan may cause the loss of features or capacity
                of your account. Codeguide does not accept any liability for
                such loss.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                Our payment process is conducted by our payment processor
                Paddle. Paddle provides customer service inquiries and handles
                returns. All fees are inclusive of all taxes, levies, or duties
                imposed by taxing authorities. Paddle will collect those taxes
                on behalf of taxing authority and remit those taxes to taxing
                authorities. See{' '}
              </span>
              <a href="https://paddle.com/legal/">
                <span>Paddle&rsquo;s Terms of Use</span>
              </a>
              <span> for details.</span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>Fees paid hereunder are non-refundable.</span>
            </p>
            <h2 className="mt-4 text-lg font-bold text-black">
              <span>Cancellation and termination</span>
            </h2>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                You are solely responsible for properly canceling your account.
                You can cancel your subscription at any time within your account
                settings.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                If you cancel the service before the end of your current paid up
                period, your cancellation will take effect at the end of the
                current billing cycle, and you will not be charged again. All of
                your private guides (except the first 3 free ones) will be
                inaccessible from the service after the time you paid for
                expires.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                You can choose to delete your account and all your data at any
                time. All your guides will be permanently deleted immediately
                when you delete your Codeguide account.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                We reserve the right to suspend or terminate your account and
                refuse any and all current or future use of the service for any
                reason at any time. Such termination of the service will result
                in the deactivation or deletion of your account or your access
                to your account and site stats. Codeguide reserves the right to
                refuse service to anyone for any reason at any time. We have
                this clause because statistically speaking, out of the thousands
                of sites on our service, there may be at least one doing
                something nefarious.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                Verbal, physical, written or other abuse (including threats of
                abuse or retribution) of any service customer, company employee
                or officer may result in immediate account termination.
              </span>
            </p>
            <h2 className="mt-4 text-lg font-bold text-black">
              <span>Modifications to the service and prices</span>
            </h2>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                We reserve the right at any time and from time to time to modify
                or discontinue, temporarily or permanently, any part of the
                service with or without notice.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                Sometimes we change the pricing structure for our products. When
                we do that, we tend to exempt existing customers from those
                changes. However, we may choose to change the prices for
                existing customers. If we do so, we will give at least 30 days
                notice and will notify you via the email address on record. We
                may also post a notice about changes on our blog or the affected
                services themselves.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                Codeguide shall not be liable to you or to any third-party for
                any modification, price change, suspension or discontinuance of
                the service.
              </span>
            </p>
            <h2 className="mt-4 text-lg font-bold text-black">
              <span>Content ownership, copyright and trademark</span>
            </h2>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                You are solely responsible for any content and other material
                that you submit, publish, transmit, email, or display on,
                through, or with the service.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                We claim no intellectual property rights over the material you
                provide to the service.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                You may provide us with feedback, suggestions, and ideas about
                the service. You agree that we own all rights to use and
                incorporate the feedback you provide in any way, including in
                future enhancements and modifications to the service, without
                payment or attribution to you.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                You must not modify another website so as to falsely imply that
                it is associated with Codeguide. The look and feel of the
                service is copyright&copy; to Codeguide. All rights reserved.
                &ldquo;Codeguide&rdquo;, the Codeguide logo and any other
                product or service name or slogan displayed on the service are
                trademarks of the company and may not be copied, imitated or
                used, in whole or in part, without the prior written permission
                of the company or the applicable trademark holder. You agree not
                to reproduce, duplicate, copy, sell, resell or exploit any
                portion of the service, use of the service, or access to the
                service without the express written permission by the company.
              </span>
            </p>
            <h2 className="mt-4 text-lg font-bold text-black">
              <span>Privacy and security of your data</span>
            </h2>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                You agree to comply with all applicable laws including all
                privacy and data protection regulations.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                You agree not to use the service to send sensitive information
                to the company where unauthorized disclosure could cause
                material, severe, or catastrophic harm or impact to the company,
                any data subjects or third-parties. Sensitive information
                includes, but is not limited to credit card information,
                passport numbers, government issued identification numbers,
                financial account information, real time geolocation and
                personally identifiable information (PII). PII is information
                that could be used on its own to directly identify, contact, or
                precisely locate an individual.
              </span>
            </p>
            <h2 className="mt-4 text-lg font-bold text-black">
              <span>General conditions</span>
            </h2>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                Your use of Codeguide is at your sole risk. The service is
                provided on an &ldquo;as is&rdquo; and &ldquo;as
                available&rdquo; basis. We do take uptime of our application
                seriously.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                We design our services with care, based on our own experience
                and the experiences of customers who share their time and
                feedback. However, there is no such thing as a service that
                pleases everybody. We make no guarantees that our services will
                meet your specific requirements or expectations.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                We also test all of our features extensively before shipping
                them. As with any software, our services inevitably have some
                bugs. We track the bugs reported to us and work through priority
                ones, especially any related to security or privacy. Not all
                reported bugs will get fixed and we don&rsquo;t guarantee
                completely error-free services.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                Technical support is provided by email. Email responses are
                provided on the reasonable effort basis without guaranteed
                response time.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                We as humans can access your data to help you with support
                requests you make and to maintain and safeguard Codeguide to
                ensure the security of your data and the service as a whole.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                We use third party vendors to provide the necessary hardware,
                storage, payment processing and related technology required to
                run the Services.&nbsp;
              </span>
            </p>
            <h2 className="mt-4 text-lg font-bold text-black">
              <span>Liability</span>
            </h2>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                We mention liability throughout these Terms but to put it all in
                one section:
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                You expressly understand and agree that Codeguide shall not be
                liable, in law or in equity, to you or to any third party for
                any direct, indirect, incidental, lost profits, special,
                consequential, punitive or exemplary damages, including, but not
                limited to, damages for loss of profits, goodwill, use, data or
                other intangible losses (even if the company has been advised of
                the possibility of such damages), resulting from: (i) the use or
                the inability to use the services; (ii) the cost of procurement
                of substitute goods and services resulting from any goods, data,
                information or services purchased or obtained or messages
                received or transactions entered into through or from the
                services; (iii) unauthorized access to or alteration of your
                transmissions or data; (iv) statements or conduct of any third
                party on the service; (v) or any other matter relating to this
                Terms of Service or the services, whether as a breach of
                contract, tort (including negligence whether active or passive),
                or any other theory of liability.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                This agreement shall be governed by the laws of Croatia, and the
                courts of Croatia shall have exclusive jurisdiction to hear and
                determine all issues that may arise under or in relation to this
                agreement.
              </span>
            </p>
            <h2 className="mt-4 text-lg font-bold text-black">
              <span>Contact us</span>
            </h2>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>
                If you have a question about any of the Terms of Service, please
                contact us.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>&nbsp;</span>
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
