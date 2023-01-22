import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { signIn, useSession } from 'next-auth/react';

export function AccessDenied() {
  const session = useSession();

  return (
    <div className=" flex h-screen w-screen items-center justify-center bg-zinc-900 bg-gradient-to-br">
      <div className="rounded-md bg-white px-40 py-20 shadow-xl">
        <div className="flex flex-col items-center">
          <h6 className="mb-2 text-center text-2xl font-bold text-gray-800 md:text-3xl">
            Access denied
          </h6>

          <div className="mb-8 text-center text-gray-500 md:text-lg">
            <span>GitHub fetch data failed.</span>
            {session.status === 'authenticated' ? (
              <p>Do you have access to the GitHub repository?</p>
            ) : (
              <p>Is it a private repo?</p>
            )}
          </div>

          {session.status !== 'authenticated' && (
            <span
              onClick={() => signIn('github')}
              className="mr-3 inline-flex cursor-pointer items-center rounded-lg border border-gray-200 bg-white py-2 px-4 text-xs font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <FontAwesomeIcon icon={faGithub} className="mr-2 h-4 w-4" />
              Login with GitHub
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
