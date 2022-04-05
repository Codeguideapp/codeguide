import React, { useCallback } from 'react';
import useSWR from 'swr';

import { getFiles } from '../api/api';
import { useStore } from '../store/store';

export function FileTree() {
  const setActivePath = useStore(
    useCallback((state) => state.setActivePath, [])
  );
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
