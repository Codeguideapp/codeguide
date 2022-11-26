import { signIn, signOut, useSession } from 'next-auth/react';

export default function Component() {
  const { data: session } = useSession();

  console.log(session?.user.accessToken);
  if (session) {
    return (
      <>
        Signed in as {session.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn('github')}>Sign in</button>
    </>
  );
}
