import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

export function Footer() {
  return (
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
              <li>
                <Link
                  href="/contact"
                  className="text-gray-500 transition hover:opacity-75"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <ul className="flex justify-center gap-6 mt-8 sm:mt-0 lg:justify-end">
            <li>
              <Link
                href="https://github.com/Codeguideapp/codeguide"
                rel="noreferrer"
                target="_blank"
                className="text-gray-700 transition hover:opacity-75"
              >
                <span className="sr-only">GitHub</span>

                <FontAwesomeIcon icon={faGithub} />
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
