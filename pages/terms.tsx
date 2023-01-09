import Link from 'next/link';

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
                <Link href="/contact"> contact us</Link>.
              </span>
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              <span>&nbsp;</span>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
