import { Avatar, Dropdown, Menu } from 'antd';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export function ProfileMenu() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <Dropdown
      overlay={
        <Menu>
          <Menu.Item>
            <Link href="/dashboard">Dashboard</Link>
          </Menu.Item>
          <Menu.Item onClick={() => signOut()}>Log out</Menu.Item>
        </Menu>
      }
    >
      <Avatar
        size="small"
        src={
          session.user.id
            ? `https://avatars.githubusercontent.com/u/${session.user.id}?v=4`
            : undefined
        }
        alt={session.user.email || ''}
      />
    </Dropdown>
  );
}
