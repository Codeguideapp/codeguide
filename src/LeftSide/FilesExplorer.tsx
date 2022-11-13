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
  allRepoFileRefsAtom,
  FileNode,
  fileNodesAtom,
  setActiveFileByPathAtom,
} from '../atoms/files';
import { fetchWithThrow } from '../utils/fetchWithThrow';
import { pathsToTreeStructure } from '../utils/pathsToTree';

let lastFetchController: AbortController | null;

export function FilesExplorer() {
  const [allRepoFileRefs] = useAtom(allRepoFileRefsAtom);
  const [, setActiveFile] = useAtom(activeFileAtom);
  const [fileNodes, setFileNodes] = useAtom(fileNodesAtom);
  const [, setActiveFileByPath] = useAtom(setActiveFileByPathAtom);

  const treeData = useMemo(
    () => pathsToTreeStructure(allRepoFileRefs),
    [allRepoFileRefs]
  );

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

          if (node.type === 'blob') {
            if (fileNodes.find((f) => f.path === node.key)) {
              setActiveFileByPath(node.key);
            } else {
              // make "loading file"
              setActiveFile({
                isFileDiff: false,
                oldVal: '',
                newVal: '',
                path: node.file.path,
                status: 'modified',
                isFetching: true,
              });

              if (lastFetchController) {
                lastFetchController.abort();
              }

              lastFetchController = new AbortController();
              fetchWithThrow(node.file.url, {
                signal: lastFetchController.signal,
                headers: localStorage.getItem('token')
                  ? {
                      Authorization: 'Bearer ' + localStorage.getItem('token'),
                    }
                  : {},
              })
                .then((res) => {
                  const content = atob(res.content);
                  const newFile: FileNode = {
                    isFileDiff: false,
                    oldVal: content,
                    newVal: content,
                    path: node.file.path,
                    status: 'modified',
                    isFetching: false,
                  };
                  setFileNodes([...fileNodes, newFile]);
                  setActiveFileByPath(node.file.path);
                })
                .catch((err) => {
                  if (err.name === 'AbortError') {
                    return;
                  }

                  // make "error file"
                  setActiveFile({
                    isFileDiff: false,
                    oldVal: '',
                    newVal: '',
                    path: node.file.path,
                    status: 'modified',
                    isFetching: false,
                    fetchError: 'error fetching file',
                  });
                });
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
