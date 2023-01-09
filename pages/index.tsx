import { Switch } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { Footer } from '../components/LandingPage/Footer';
import { Header } from '../components/LandingPage/Header';

export default function Page() {
  const [pricing, setPricing] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <div>
      <section
        style={{
          background: 'linear-gradient(45deg, #4489c1 0%, #8124b3 100%)',
        }}
      >
        <Header />

        <div className="px-12 mx-auto max-w-7xl">
          <div className="w-full mx-auto text-left md:w-11/12 xl:w-9/12 md:text-center">
            <h1 className="font-catamaran mb-8 text-3xl font-extrabold leading-none tracking-normal text-white md:text-5xl md:tracking-tight">
              Step-by-step code walkthroughs
            </h1>
            <p className="px-0 mb-8 text-lg text-white md:text-xl lg:px-24">
              Open-source tool for creating and viewing code guides. For
              onboarding, explaining the context of a code review, and more.
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
                  Onboard (or re-board) to a new project or feature
                </h2>
              </div>

              <p className="text-lg mt-4 leading-relaxed text-gray-700">
                With code guides you can help new team members understand the
                codebase and get up to speed quickly. Also, it&apos;s a great
                way to re-board yourself to a project or feature area you
                haven&apos;t worked on for a while.
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
                  Make code presentations
                </h2>
              </div>

              <p className="text-lg mt-4 leading-relaxed text-gray-700">
                You can also use Codeguide for creating code presentations,
                whether it&apos;s for a conference talk or a training session.
              </p>
            </div>

            <div className="py-4">
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-black">
                  Transparent and fully open source software
                </h2>
              </div>

              <p className="text-lg mt-4 leading-relaxed text-gray-700">
                Codeguide&apos;s{' '}
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
              Guides are linked to a specific commit, so when a guide is opened,
              it will display the code as it existed at that point in time.
            </p>

            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              In the case of code review guides, code changes are usually not a
              problem because these guides are meant to help reviewers focus on
              important parts of the PR. By the time the code changes, the
              reviewer should already be familiar with it.
            </p>

            <p className="text-lg mt-4 leading-relaxed text-gray-700">
              For onboarding guides, outdated content can still provide valuable
              context and background information. But, if the code change is too
              significant, you will have to create a new guide.
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
              </Link>{' '}
              for VS Code.
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

      <Footer />
    </div>
  );
}
