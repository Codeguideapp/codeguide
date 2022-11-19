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
import React, { useEffect, useMemo, useState } from 'react';
import { useResizeDetector } from 'react-resize-detector';

import { changesAtom, highlightChangeIdAtom } from '../atoms/changes';
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
  const treeRef = React.useRef<any>();
  const [allRepoFileRefs] = useAtom(allRepoFileRefsAtom);
  const [activeFile, setActiveFile] = useAtom(activeFileAtom);
  const [fileNodes, setFileNodes] = useAtom(fileNodesAtom);
  const [, setActiveFileByPath] = useAtom(setActiveFileByPathAtom);
  const [highlightChangeId] = useAtom(highlightChangeIdAtom);
  const [changes] = useAtom(changesAtom);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [wrapperHeight, setWrapperHeight] = useState(400);

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
    if (!highlightChangeId) return;

    const pathArr = changes[highlightChangeId].path.split('/');
    const toExpland = pathArr.reduce((acc: string[], curr: string) => {
      const nextPath = [...acc, curr].join('/');
      return [...acc, nextPath];
    }, []);

    setExpanded((prevVal) => uniq([...prevVal, ...toExpland]));

    setTimeout(() => {
      treeRef.current.scrollTo({
        key: changes[highlightChangeId].path,
        align: 'top',
        offset: 50,
      });
    }, 200);
  }, [highlightChangeId, changes]);

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
