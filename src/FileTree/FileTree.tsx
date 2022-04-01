import React, { useCallback } from 'react';

import { useStore } from '../store/store';

export function FileTree() {
  const setActivePath = useStore(
    useCallback((state) => state.setActivePath, [])
  );
  const files = useStore((state) => state.files);

  return (
    <div>
      <ul>
        {files.map((file) => {
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
