import {
  faChevronDown,
  faChevronRight,
  faFile,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AntdTreeNodeAttribute } from 'antd/lib/tree';
import ForwardDirectoryTree from 'antd/lib/tree/DirectoryTree';
import { useAtom } from 'jotai';
import React, { useMemo } from 'react';

import {
  activeFileAtom,
  FileBrowse,
  fileChangesAtom,
  repoFilesAtom,
  setFileByPathAtom,
} from '../atoms/files';
import { pathsToTreeStructure } from '../utils/pathsToTree';

export function FilesExplorer() {
  const [repoFiles] = useAtom(repoFilesAtom);
  const [, setActiveFile] = useAtom(activeFileAtom);
  const [fileChanges] = useAtom(fileChangesAtom);
  const [, setFileByPath] = useAtom(setFileByPathAtom);

  const treeData = useMemo(() => pathsToTreeStructure(repoFiles), [repoFiles]);

  return (
    <div className="file-tree">
      <div className="header">Explorer</div>
      <ForwardDirectoryTree
        className="directory-tree"
        treeData={treeData}
        switcherIcon={<span></span>}
        icon={getIcon}
        // activeKey={activeFile?.path}
        // selectedKeys={[activeFile?.path || '']}
        onSelect={(_selected, info) => {
          const node = info.node as any;

          const file: FileBrowse = {
            path: node.key,
            sha: node.sha,
            type: node.type,
            url: node.url,
          };

          if (file.type === 'blob') {
            if (fileChanges.find((f) => f.path === node.key)) {
              setFileByPath(node.key);
            } else {
              setActiveFile(file);
            }
          }
        }}
      />
    </div>
  );
}

function getIcon(props: AntdTreeNodeAttribute): React.ReactNode {
  const { isLeaf, expanded } = props;
  if (isLeaf) {
    return <FontAwesomeIcon icon={faFile} />;
  }
  return expanded ? (
    <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: 11 }} />
  ) : (
    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 11 }} />
  );
}
