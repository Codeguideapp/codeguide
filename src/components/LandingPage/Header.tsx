import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Head from 'next/head';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

import { LogoIcon } from '../svgIcons/LogoIcon';

export function Header() {
  const { data: session } = useSession();

  return (
    <>
      <Head>
        <title>CodeGuide</title>
      </Head>
      <header aria-label="Site Header">
        <div className="mx-auto mb-10 max-w-screen-lg px-12">
          <div className="flex h-16 items-center justify-between">
            <div className="flex-1 md:flex md:items-center md:gap-12">
              <Link
                className="flex items-center gap-2 text-base font-bold text-white hover:text-white"
                href="/"
              >
                <LogoIcon />
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
                      className="text-white transition hover:text-white/75"
                      href="/#features"
                    >
                      Features
                    </Link>
                  </li>

                  <li>
                    <Link
                      className="text-white transition hover:text-white/75"
                      href="/#pricing"
                    >
                      Pricing
                    </Link>
                  </li>

                  <li>
                    <Link
                      className="text-white transition hover:text-white/75"
                      href="/#faq"
                    >
                      FAQ
                    </Link>
                  </li>

                  <li>
                    {session ? (
                      <span
                        onClick={() => signOut()}
                        className="flex cursor-pointer items-center justify-center gap-2  rounded-full border-white border-opacity-20 px-4 py-3 text-sm font-medium text-white hover:bg-white hover:text-black"
                      >
                        <FontAwesomeIcon icon={faGithub} className="text-lg" />
                        <span>Log out</span>
                      </span>
                    ) : (
                      <span
                        onClick={() => signIn('github')}
                        className="flex cursor-pointer items-center justify-center gap-2  rounded-full border-white border-opacity-20 px-4 py-3 text-sm font-medium text-white hover:bg-white hover:text-black"
                      >
                        <FontAwesomeIcon icon={faGithub} className="text-lg" />
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
    </>
  );
}
