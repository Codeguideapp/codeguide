import { useAtom } from 'jotai';
import React from 'react';

import { repoFilesAtom } from '../atoms/files';

export function FilesExplorer() {
  const [repoFiles] = useAtom(repoFilesAtom);

  console.log(repoFiles);

  return (
    <div className="file-tree">
      <div className="header">Explorer</div>
      <div style={{ paddingLeft: 20 }}>
        <div>Explorer is not implemented yet</div>
        <br />
        <div>
          When finished, this section will show the entire directory rather than
          just changed files
        </div>
      </div>
    </div>
  );
}
