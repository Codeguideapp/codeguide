import {
  faChevronDown,
  faChevronRight,
  faFile,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AntdTreeNodeAttribute } from 'antd/lib/tree';
import ForwardDirectoryTree from 'antd/lib/tree/DirectoryTree';
import { useAtom } from 'jotai';
import { uniq } from 'lodash';
import { useSession } from 'next-auth/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useResizeDetector } from 'react-resize-detector';

import { expandedFilesAtom } from '../store/atoms';
import { useChangesStore } from '../store/changes';
import { FileNode, useFilesStore } from '../store/files';
import { fetchWithThrow } from '../../utils/fetchWithThrow';
import { pathsToTreeStructure } from '../../utils/pathsToTree';

let lastFetchController: AbortController | null;

export function FilesExplorer() {
  const treeRef = React.useRef<any>();
  const highlightChange = useChangesStore((s) =>
    s.activeChangeId ? s.changes[s.activeChangeId] : null
  );
  const fileNodes = useFilesStore((s) => s.fileNodes);
  const setFileNodes = useFilesStore((s) => s.setFileNodes);
  const allRepoFileRefs = useFilesStore((s) => s.allRepoFileRefs);
  const activeFile = useFilesStore((s) => s.activeFile);
  const setActiveFile = useFilesStore((s) => s.setActiveFile);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);
  const [expanded, setExpanded] = useAtom(expandedFilesAtom);
  const [wrapperHeight, setWrapperHeight] = useState(400);
  const { data: session } = useSession();

  const treeData = useMemo(
    () => pathsToTreeStructure(allRepoFileRefs),
    [allRepoFileRefs]
  );

  const { ref } = useResizeDetector({
    onResize(_, height) {
      if (typeof height === 'number' && wrapperHeight !== height) {
        setWrapperHeight(height);
      }
    },
  });

  useEffect(() => {
    if (!highlightChange) return;

    const pathArr = highlightChange.path.split('/');
    const toExpland = pathArr.reduce((acc: string[], curr: string) => {
      const nextPath = [...acc, curr].join('/');
      return [...acc, nextPath];
    }, []);

    setExpanded((prevVal) => uniq([...prevVal, ...toExpland]));

    setTimeout(() => {
      treeRef.current.scrollTo({
        key: highlightChange.path,
        align: 'bottom',
        offset: 50,
      });
    }, 200);
  }, [highlightChange, setExpanded]);

  return (
    <div className="file-tree" ref={ref}>
      <div className="header">Explorer</div>
      <ForwardDirectoryTree
        ref={treeRef}
        className="directory-tree"
        treeData={treeData}
        switcherIcon={<span></span>}
        icon={getIcon}
        activeKey={activeFile?.path}
        selectedKeys={[activeFile?.path || '']}
        expandedKeys={expanded}
        height={wrapperHeight - 40}
        onSelect={(selected, info) => {
          const node = info.node as any;

          if (node.type === 'tree' && selected.length === 1) {
            if (node.expanded) {
              setExpanded((prevVal) =>
                prevVal.filter((key) => key !== selected[0])
              );
            } else {
              setExpanded((prevVal) => [...prevVal, selected[0] as string]);
            }
          }

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
                headers: session
                  ? {
                      Authorization: 'Bearer ' + session.user.accessToken,
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
