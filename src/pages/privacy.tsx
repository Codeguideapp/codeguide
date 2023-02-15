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
              Privacy policy
            </h1>
          </div>
          <div className="mx-auto mt-14 w-full text-center md:w-4/6"></div>
        </div>
      </section>

      <section>
        <div className="m-auto flow-root max-w-3xl px-8">
          <div className="py-4">
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Codeguide is committed to protecting the privacy of its users.
              This privacy policy explains how Codeguide collects, uses, and
              shares information about you when you use our application.
            </p>

            <div className="mt-4 flex items-center">
              <h3 className="text-lg font-bold text-black">
                Information We Collect and How We Use It
              </h3>
            </div>

            <p className="mt-2 text-lg leading-relaxed text-gray-700">
              We collect and store the email address of our users to determine
              the access for guides. We also store code &quot;deltas&quot;, or
              the parts of code that are added, deleted or highlighted. Other
              files in repositories are not stored but can be accessed using
              GitHub API directly.
            </p>

            <div className="mt-4 flex items-center">
              <h3 className="text-lg font-bold text-black">
                Sharing Your Information
              </h3>
            </div>

            <p className="mt-2 text-lg leading-relaxed text-gray-700">
              We will only share your information with third parties in the
              following circumstances:
            </p>
            <ul className="ml-8 mt-2 list-disc text-lg leading-relaxed text-gray-700">
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
            <p className="mt-2 text-lg leading-relaxed text-gray-700">
              For private repositories, users of Codeguide must log in with
              their GitHub account and will only have access to repository data
              to which they have access on GitHub.
            </p>

            <div className="mt-4 flex items-center">
              <h3 className="text-lg font-bold text-black">Data Retention</h3>
            </div>

            <p className="mt-2 text-lg leading-relaxed text-gray-700">
              We will retain your information for as long as your account is
              active or as needed to provide you the Services. We will retain
              and use your information as necessary to comply with our legal
              obligations, resolve disputes, and enforce our agreements.
            </p>
            <div className="mt-4 flex items-center">
              <h3 className="text-lg font-bold text-black">
                Your Rights and Choices
              </h3>
            </div>
            <p className="mt-2 text-lg leading-relaxed text-gray-700">
              You have certain rights in relation to your personal information,
              including the right to request access, correction, erasure,
              restriction, transfer, to object to processing, to withdraw
              consent, and to opt out of the sale of your personal information.
              Not all of these rights apply in all circumstances, and we may
              need to retain certain information for legitimate business or
              legal purposes.
            </p>
            <p className="mt-2 text-lg leading-relaxed text-gray-700">
              You may exercise these rights by contacting us using the contact
              information provided below.
            </p>
            <p className="mt-2 text-lg leading-relaxed text-gray-700">
              You can also control cookies and tracking tools. Most web browsers
              are set to accept cookies by default. If you prefer, you can
              usually choose to set your browser to remove or reject cookies.
              Please note that if you choose to remove or reject cookies, this
              could affect the availability and functionality of the Services.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
