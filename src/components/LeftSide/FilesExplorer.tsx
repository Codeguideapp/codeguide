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

import { pathsToTreeStructure } from '../../utils/pathsToTree';
import { expandedFilesAtom } from '../store/atoms';
import { useChangesStore } from '../store/changes';
import { useFilesStore } from '../store/files';
import { useGuideStore } from '../store/guide';

export function FilesExplorer() {
  const treeRef = React.useRef<any>();
  const highlightChange = useChangesStore((s) =>
    s.activeChangeId ? s.changes[s.activeChangeId] : null
  );
  const fileRefs = useGuideStore((s) => s.fileRefs);
  const activeFile = useFilesStore((s) => s.activeFile);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);
  const [expanded, setExpanded] = useAtom(expandedFilesAtom);
  const [wrapperHeight, setWrapperHeight] = useState(400);

  const treeData = useMemo(() => pathsToTreeStructure(fileRefs), [fileRefs]);

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
    const toExpland: string[] = [];
    for (let i = 0; i < pathArr.length; i++) {
      const nextPath = [...pathArr.slice(0, i + 1)].join('/');
      toExpland.push(nextPath);
    }

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
            setActiveFileByPath(node.key);
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
