import {
  faChevronDown,
  faChevronRight,
  faFile,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AntdTreeNodeAttribute } from 'antd/lib/tree';
import ForwardDirectoryTree from 'antd/lib/tree/DirectoryTree';
import { useAtom } from 'jotai';
import { last, uniq } from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { decodeTime } from 'ulid';

import { expandedFilesAtom, isEditing } from '../store/atoms';
import { useFilesStore } from '../store/files';
import { useStepsStore } from '../store/steps';
import { pathsToTreeStructure } from './pathsToTree';

export function FilesExplorer() {
  const setActiveChangeId = useStepsStore((s) => s.setActiveStepId);
  const treeRef = React.useRef<any>();
  const highlightChange = useStepsStore((s) =>
    s.activeStepId ? s.steps[s.activeStepId] : null
  );
  const appliedPaths = useStepsStore((s) => {
    const changeIds = Object.keys(s.steps).sort();
    const isAtEnd = !s.activeStepId && changeIds.length;
    const activeChangeId = isAtEnd ? last(changeIds) : s.activeStepId;

    return uniq(
      changeIds
        .filter((id) =>
          !activeChangeId ? false : decodeTime(id) <= decodeTime(activeChangeId)
        )
        .map((id) => s.steps[id].path)
    );
  });
  const fileRefs = useFilesStore((s) => s.fileRefs);
  const activeFile = useFilesStore((s) => s.activeFile);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);
  const [expanded, setExpanded] = useAtom(expandedFilesAtom);

  const treeData = useMemo(() => {
    const commitedFileRefs = fileRefs.filter(
      (ref) =>
        (ref.origin === 'commit' || ref.origin === 'pr') &&
        !ref.isAdded &&
        !ref.isDeleted
    );

    const fromApplied = appliedPaths
      .map((path) => ({ path, type: 'blob' }))
      .filter((item) => {
        const file = fileRefs.find((f) => f.path === item.path);
        return file?.origin === 'pr' && (file.isAdded || file.isDeleted);
      });

    return pathsToTreeStructure([...commitedFileRefs, ...fromApplied]);
  }, [fileRefs, appliedPaths]);

  useEffect(() => {
    if (!highlightChange) return;

    const pathArr = highlightChange.path.split('/');
    const toExpland: string[] = [];
    for (let i = 0; i < pathArr.length; i++) {
      const nextPath = [...pathArr.slice(0, i + 1)].join('/');
      toExpland.push(nextPath);
    }

    setExpanded(uniq(toExpland));

    setTimeout(() => {
      treeRef.current.scrollTo({
        key: highlightChange.path,
        align: 'bottom',
        offset: 50,
      });
    }, 200);
  }, [highlightChange, setExpanded]);

  return (
    <div className="file-tree flex flex-col">
      <div className="header">Explorer</div>
      <ForwardDirectoryTree
        ref={treeRef}
        className="grow overflow-auto"
        treeData={treeData}
        switcherIcon={<span></span>}
        icon={getIcon}
        selectedKeys={[activeFile?.path || '']}
        expandedKeys={expanded}
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
            if (isEditing()) {
              setActiveChangeId(null);
            }
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
