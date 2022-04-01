import React, { useCallback } from 'react';

import { useStore } from '../store/store';

export function FileTree() {
  const initFile = useStore(useCallback((state) => state.initFile, []));
  const files = useStore((state) => state.files);

  if (files.length === 0) return <div>loading...</div>;

  return (
    <div>
      <ul>
        {files.map((file) => {
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
