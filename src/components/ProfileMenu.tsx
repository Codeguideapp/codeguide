/* eslint-disable @next/next/no-html-link-for-pages */
import { Avatar, Dropdown, Menu } from 'antd';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export function ProfileMenu({
  hasUnpublishedData,
}: {
  hasUnpublishedData?: boolean;
}) {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <Dropdown
      overlay={
        <Menu>
          <Menu.Item>
            <a href="/dashboard">Dashboard</a>
          </Menu.Item>
          <Menu.Item
            onClick={() => {
              if (!hasUnpublishedData) {
                return signOut();
              }

              if (
                window.confirm(
                  'You have unpublished changes. Are you sure you want to log out?'
                )
              ) {
                signOut();
              }
            }}
          >
            Log out
          </Menu.Item>
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
