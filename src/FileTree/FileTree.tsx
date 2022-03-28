import React, { useCallback } from 'react';
import useSWR from 'swr';

import { getFiles } from '../api/api';
import { useStore } from '../store/store';

export function FileTree() {
  const initFile = useStore(useCallback((state) => state.initFile, []));
  const { data, error } = useSWR('/api/files/0', (url) => getFiles(0));

  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;

  return (
    <div>
      <ul>
        {data.map((file) => {
          return (
            <li onClick={() => initFile(file.path)} key={file.path}>
              {file.path}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
