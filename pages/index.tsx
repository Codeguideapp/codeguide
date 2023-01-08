import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Switch } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useState } from 'react';

export default function Page() {
  const [pricing, setPricing] = useState<'monthly' | 'yearly'>('yearly');
  const { data: session } = useSession();

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
                      <a
                        className="transition text-white hover:text-white/75"
                        href="#features"
                      >
                        Features
                      </a>
                    </li>

                    <li>
                      <a
                        className="transition text-white hover:text-white/75"
                        href="#pricing"
                      >
                        Pricing
                      </a>
                    </li>

                    <li>
                      <a
                        className="transition text-white hover:text-white/75"
                        href="#faq"
                      >
                        FAQ
                      </a>
                    </li>

                    <li>
                      {session ? (
                        <span
                          onClick={() => signOut()}
                          className="cursor-pointer gap-2 flex items-center justify-center  rounded-full border-white border-opacity-20 px-4 py-3 text-sm font-medium text-white hover:bg-white hover:text-black"
                        >
                          <FontAwesomeIcon
                            icon={faGithub}
                            className="text-lg"
                          />
                          <span>Log out</span>
                        </span>
                      ) : (
                        <span
                          onClick={() => signIn('github')}
                          className="cursor-pointer gap-2 flex items-center justify-center  rounded-full border-white border-opacity-20 px-4 py-3 text-sm font-medium text-white hover:bg-white hover:text-black"
                        >
                          <FontAwesomeIcon
                            icon={faGithub}
                            className="text-lg"
                          />
                          <span>Log in</span>
                        </span>
                      )}
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </header>

        <div className="px-12 mx-auto max-w-7xl">
          <div className="w-full mx-auto text-left md:w-11/12 xl:w-9/12 md:text-center">
            <h1 className="font-catamaran mb-8 text-3xl font-extrabold leading-none tracking-normal text-white md:text-5xl md:tracking-tight">
              Step-by-step code walkthroughs
            </h1>
            <p className="px-0 mb-8 text-lg text-white md:text-xl lg:px-24">
              Open-source online tool for onboarding and re-boarding,
              understanding the context of a code review or making code
              presentations
            </p>
            <div className="mb-4 flex md:block flex-col items-center space-y-2 space-x-0 md:space-x-2 md:mb-8 ">
              <Link
                className="inline-block rounded-full border border-white bg-white px-6 py-3 text-sm font-medium text-black focus:outline-none focus:ring"
                href="/download"
              >
                Create guide
              </Link>
              <Link
                className="inline-block rounded-full border border-white px-4 py-3 text-sm font-medium text-white hover:bg-white hover:text-black focus:outline-none focus:ring"
                href="/download"
              >
                Try example
              </Link>
            </div>
            <div></div>
          </div>
          <div className="w-full mx-auto mt-14 text-center md:w-4/6">
            <div className="relative z-0 w-full mt-8 mb-8">
              <Image
                style={{ boxShadow: '0 8px 16px #0005' }}
                width={2200}
                height={1462}
                src="/landing/hero.png"
                alt="Codeguide"
              />
            </div>
          </div>
        </div>
        <div>
          <svg viewBox="0 0 1695 57" preserveAspectRatio="none">
            <path
              d="M0 23c135.4 19 289.6 28.5 462.5 28.5C721.9 51.5 936.7 1 1212.2 1 1395.8.9 1556.7 8.3 1695 23v34H0V23z"
              fill="rgba(255,255,255,1)"
              fillRule="evenodd"
            ></path>
          </svg>
        </div>
      </section>
      <section id="features" className="bg-white text-black mb-8">
        <div className="flow-root max-w-3xl m-auto px-8">
          <div className="">
            <div className=" py-4">
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-black">
                  Onboard new team members faster
                </h2>
              </div>

              <p className="text-lg mt-4 leading-relaxed text-gray-700">
                With Codeguide, you can easily create step-by-step code
                walkthroughs, helping new team members understand the codebase
                and get up to speed quickly.
              </p>
            </div>

            <div className="py-4">
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-black">
                  Understand the context of a code review/PR change
                </h2>
              </div>

              <p className="text-lg mt-4 leading-relaxed text-gray-700">
                It makes it easy for PR authors to draw attention to important
                parts of their changes and for reviewers to focus on those
                first.
              </p>
            </div>

            <div className="py-4">
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-black">
                  Transparent and fully open source software
                </h2>
              </div>

              <p className="text-lg mt-4 leading-relaxed text-gray-700">
                The{' '}
                <a
                  className="font-bold"
                  href="https://github.com/codeguideapp/codeguide"
                  target="_blank"
                  rel="noreferrer"
                >
                  source code
                </a>{' '}
                is available on GitHub so anyone can read it, inspect it and
                review it. If you&apos;re happy to manage your own
                infrastructure, you can self-host it. It is licenced under the
                GNU Affero General Public License Version 3 (AGPLv3).
              </p>
            </div>
          </div>
        </div>
      </section>
      <section id="pricing" className="bg-neutral-900 pt-16 mb-12 ">
        <div className="mx-auto max-w-lg text-center mb-6">
          <span className="font-catamaran text-3xl font-bold sm:text-4xl">
            Pricing
          </span>
        </div>

        <div className="flex gap-4 justify-center mb-16">
          <span
            style={{ fontWeight: pricing === 'monthly' ? 'bold' : 'normal' }}
          >
            Monthly
          </span>
          <Switch
            checked={pricing === 'yearly'}
            onChange={(checked) => setPricing(checked ? 'yearly' : 'monthly')}
            className="bg-neutral-800"
          />
          <span
            style={{ fontWeight: pricing === 'yearly' ? 'bold' : 'normal' }}
          >
            Yearly
          </span>
        </div>
        <div className="flex justify-center gap-4  flex-wrap">
          <div className="w-56 p-4 shadow-sm rounded-2xl bg-neutral-900 border  border-gray-500/10 shadow-gray-500/10">
            <p className="mb-4 text-xl font-medium text-gray-50">Free</p>
            <p className="text-3xl font-bold text-white">
              $0
              <span className="text-sm text-gray-300">/ month</span>
            </p>

            <ul className="w-full mt-6 mb-6 text-sm text-gray-100">
              <li className="mb-3 flex items-center ">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                </svg>
                Unlimited team members
              </li>
              <li className="mb-3 flex items-center ">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                </svg>
                Unlimited public guides
              </li>
              <li className="mb-3 flex items-center ">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                </svg>
                3 private guides
              </li>
            </ul>

            <div className="flex justify-center">
              <Link
                className="relative font-medium text-white before:absolute before:-bottom-1 before:h-0.5 before:w-full before:origin-left before:scale-x-0 before:bg-amber-200 hover:text-amber-200 before:transition hover:before:scale-100"
                href="/download"
              >
                Create Guide
              </Link>
            </div>
          </div>
          <div className="w-56 p-4 shadow-sm rounded-2xl bg-neutral-900 border border-gray-500/10 shadow-gray-500/10">
            <p className="mb-4 text-xl font-medium text-gray-50">Basic</p>
            <p className="text-3xl font-bold text-white">
              {pricing === 'monthly' ? '$15' : '$12'}
              <span className="text-sm text-gray-300">/ month</span>
            </p>
            <ul className="w-full mt-6 mb-6 text-sm text-gray-100">
              <li className="mb-3 flex items-center ">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                </svg>
                5 team members
              </li>
              <li className="mb-3 flex items-center ">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                </svg>
                Unlimited public guides
              </li>
              <li className="mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                </svg>
                Unlimited private guides
              </li>
            </ul>
            <div className="flex justify-center">
              <Link
                className="relative font-medium text-white before:absolute before:-bottom-1 before:h-0.5 before:w-full before:origin-left before:scale-x-0 before:bg-amber-200 hover:text-amber-200 before:transition hover:before:scale-100"
                href="/download"
              >
                Choose Plan
              </Link>
            </div>
          </div>
          <div className="w-56 p-4 shadow-sm rounded-2xl bg-neutral-900 border border-neutral-600 shadow-gray-500/10">
            <p className="mb-4 text-xl font-medium text-gray-50">Pro</p>
            <p className="text-3xl font-bold text-white">
              {pricing === 'monthly' ? '$40' : '$35'}
              <span className="text-sm text-gray-300">/ month</span>
            </p>
            <ul className="w-full mt-6 mb-6 text-sm text-gray-100">
              <li className="mb-3 flex items-center ">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                </svg>
                20 team members
              </li>
              <li className="mb-3 flex items-center ">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                </svg>
                Unlimited public guides
              </li>
              <li className="mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                </svg>
                Unlimited private guides
              </li>
            </ul>
            <div className="flex justify-center">
              <Link
                className="relative font-medium text-white before:absolute before:-bottom-1 before:h-0.5 before:w-full before:origin-left before:scale-x-0 before:bg-amber-200 hover:text-amber-200 before:transition hover:before:scale-100"
                href="/download"
              >
                Choose Plan
              </Link>
            </div>
          </div>
          <div className="w-56 p-4 shadow-sm rounded-2xl bg-neutral-900 border border-gray-500/10 shadow-gray-500/10">
            <p className="mb-4 text-xl font-medium text-gray-50">Enterprise</p>
            <div className="py-1"></div>
            <ul className="w-full mt-6 mb-6 text-sm text-gray-100">
              <li className="mb-3 flex items-center ">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                </svg>
                Unlimited team members
              </li>
              <li className="mb-3 flex items-center ">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                </svg>
                Unlimited public guides
              </li>
              <li className="mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                </svg>
                Unlimited private guides
              </li>
              <li className="mb-3 flex items-center">
                <svg
                  className="w-4 min-w-min self-start h-4 mr-2 mt-2"
                  fill="#fff"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                </svg>
                Host on your servers (support/development)
              </li>
            </ul>
            <div className="flex justify-center">
              <Link
                className="relative font-medium text-white before:absolute before:-bottom-1 before:h-0.5 before:w-full before:origin-left before:scale-x-0 before:bg-amber-200 hover:text-amber-200 before:transition hover:before:scale-100"
                href="/download"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        <div className="divider divider--wave divider--front mt-10">
          <svg viewBox="0 0 1695 57" preserveAspectRatio="none">
            <path
              d="M0 23c135.4 19 289.6 28.5 462.5 28.5C721.9 51.5 936.7 1 1212.2 1 1395.8.9 1556.7 8.3 1695 23v34H0V23z"
              fill="#fff"
              fillRule="evenodd"
            ></path>
          </svg>
        </div>
      </section>
      <section id="faq">
        <div className="flow-root max-w-3xl m-auto px-8">
          <div className=" py-4">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-black">
                What happens to the guide when the code changes?
              </h2>
            </div>

            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              Guides are linked to specific commit, so when a guide is opened,
              it will display the code as it existed at that point in time.
            </p>

            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              In the case of code reviews, updating a guide is generally not
              necessary because code review guides are meant to help reviewers
              focus on imporant parts of the PR. By the time the code changes,
              the reviewer should already be familiar with it.
            </p>

            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              For onboarding, most of the time, this is not a problem because an
              outdated guide can still provide valuable context and background
              information. But, if the code change is too significant, you will
              have to create a new guide.
            </p>

            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              However, we are currently working on a feature that will make it
              easier to update guides. Stay tuned!
            </p>
          </div>

          <div className=" py-4">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-black">
                Why is this not an IDE extension?
              </h2>
            </div>

            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              If an IDE extension is more convenient for you, check out{' '}
              <Link
                target="_blank"
                href="https://marketplace.visualstudio.com/items?itemName=vsls-contrib.codetour"
              >
                CodeTour
              </Link>
              .
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              However, CodeTour does not offer code generation as you progress
              through the steps, it only provides interactive walkthroughs for
              highlighted code.
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              Also, we believe that a web-based solution is more suitable for
              onboarding because it can be easily shared with anyone, even if
              they don&apos;t have the same IDE.
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              Additionally, code guides are the main focus of this product, so
              the user interface and user experience are optimized specifically
              for that.
            </p>
          </div>

          <div className=" py-4">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-black">
                How is private access secured?
              </h2>
            </div>

            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              For onboarding guides, we fetch code directly from GitHub and
              store only filenames and line numbers. For code review guides, we
              also store code &quot;deltas&quot;, or the parts of code that are
              added or deleted.
            </p>
            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              In the case of private repositories, this data is only returned if
              the user has access to the repository on GitHub.
            </p>
          </div>
        </div>
      </section>

      <footer aria-label="Site Footer" className="bg-white">
        <div className="max-w-screen-xl px-4 pb-8 mx-auto sm:px-6 lg:px-8">
          <div className="pt-8 mt-16 border-t border-gray-100 sm:flex sm:items-center sm:justify-between lg:mt-24">
            <nav aria-label="Footer Navigation - Support">
              <ul className="flex flex-wrap justify-center gap-4 text-xs lg:justify-end">
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-500 transition hover:opacity-75"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-500 transition hover:opacity-75"
                  >
                    Terms of Service
                  </Link>
                </li>
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
