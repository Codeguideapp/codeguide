import { useAtom } from 'jotai';
import React from 'react';
import useSWR from 'swr';

import { getFiles } from '../api/api';
import { activePathAtom } from '../atoms/files';

export function FileTree() {
  const [, setActivePath] = useAtom(activePathAtom);
  const { data } = useSWR('/test', () => getFiles(0));

  if (!data) {
    return <div>loading...</div>;
  }

  return (
    <div>
      <ul>
        {data.map((file) => {
          return (
            <li onClick={() => setActivePath(file.path)} key={file.path}>
              {file.path}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
