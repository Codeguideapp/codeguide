import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();

  return (
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

                <li>
                  {session ? (
                    <span
                      onClick={() => signOut()}
                      className="cursor-pointer gap-2 flex items-center justify-center  rounded-full border-white border-opacity-20 px-4 py-3 text-sm font-medium text-white hover:bg-white hover:text-black"
                    >
                      <FontAwesomeIcon icon={faGithub} className="text-lg" />
                      <span>Log out</span>
                    </span>
                  ) : (
                    <span
                      onClick={() => signIn('github')}
                      className="cursor-pointer gap-2 flex items-center justify-center  rounded-full border-white border-opacity-20 px-4 py-3 text-sm font-medium text-white hover:bg-white hover:text-black"
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
  );
}
