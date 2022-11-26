import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { signIn } from 'next-auth/react';

export function AccessDenied() {
  return (
    <div className=" flex items-center justify-center w-screen h-screen bg-gradient-to-br bg-zinc-900">
      <div className="px-40 py-20 bg-white rounded-md shadow-xl">
        <div className="flex flex-col items-center">
          <h6 className="mb-2 text-2xl font-bold text-center text-gray-800 md:text-3xl">
            Access denied
          </h6>

          <p className="mb-8 text-center text-gray-500 md:text-lg">
            GitHub fetch data failed. Is it a private repo?
          </p>

          <span
            onClick={() => signIn('github')}
            className="cursor-pointer inline-flex items-center py-2 px-4 mr-3 text-xs font-medium text-gray-900 bg-white rounded-lg border border-gray-200 focus:outline-none hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-gray-300"
          >
            <FontAwesomeIcon icon={faGithub} className="mr-2 w-4 h-4" />
            Login with GitHub
          </span>
        </div>
      </div>
    </div>
  );
}
