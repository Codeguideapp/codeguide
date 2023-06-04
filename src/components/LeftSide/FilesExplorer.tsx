import { faSquareCheck } from '@fortawesome/free-regular-svg-icons';
import {
  faChevronDown,
  faChevronRight,
  faFile,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip, TreeProps } from 'antd';
import type { AntdTreeNodeAttribute } from 'antd/lib/tree';
import ForwardDirectoryTree from 'antd/lib/tree/DirectoryTree';
import { useAtom } from 'jotai';
import { last, uniq } from 'lodash';
import Delta from 'quill-delta';
import React, { useEffect, useMemo, useState } from 'react';
import { decodeTime } from 'ulid';

import { expandedFilesAtom, isEditing } from '../store/atoms';
import { useFilesStore } from '../store/files';
import { useStepsStore } from '../store/steps';
import { pathsToTreeStructure } from './pathsToTree';

export function FilesExplorer() {
  const setActiveStepId = useStepsStore((s) => s.setActiveStepId);
  const activeStep = useStepsStore((s) =>
    s.activeStepId ? s.steps[s.activeStepId] : null
  );
  const [isCheckable, setIsCheckable] = useState(false);
  const [checkedPaths, setCheckedPaths] = useState<TreeProps['checkedKeys']>(
    []
  );
  const treeRef = React.useRef<any>();
  const highlightChange = useStepsStore((s) =>
    s.activeStepId ? s.steps[s.activeStepId] : null
  );
  const saveDelta = useStepsStore((s) => s.saveDelta);
  const appliedPaths = useStepsStore((s) => {
    const stepIds = Object.keys(s.steps).sort();
    const isAtEnd = !s.activeStepId && stepIds.length;
    const activeChangeId = isAtEnd ? last(stepIds) : s.activeStepId;

    return uniq(
      stepIds
        .filter((id) =>
          !activeChangeId ? false : decodeTime(id) <= decodeTime(activeChangeId)
        )
        .map((id) => s.steps[id].path)
    );
  });
  const activeIntroPaths = useStepsStore((s) => {
    const hasIntroStep = Object.values(s.steps).some((step) => step.introStep);
    if (!hasIntroStep) {
      return [];
    }
    if (!s.activeStepId) {
      return [];
    }
    if (!s.steps[s.activeStepId].introStep) {
      return [];
    }

    const stepIds = Object.keys(s.steps).sort();

    return stepIds
      .slice(0, stepIds.indexOf(s.activeStepId) + 1)
      .map((id) => s.steps[id])
      .filter((step) => !step.isFileDepChange)
      .map((step) => step.path);
  });

  const fileRefs = useFilesStore((s) => s.fileRefs);
  const activeFile = useFilesStore((s) => s.activeFile);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);
  const [expanded, setExpanded] = useAtom(expandedFilesAtom);

  const treeData = useMemo(() => {
    const commitedFileRefs = fileRefs.filter((ref) => {
      if (activeIntroPaths.length) {
        // if intro steps are active, only show files that are part of the intro
        return activeIntroPaths.includes(ref.path);
      }

      return (
        (ref.origin === 'commit' || ref.origin === 'pr') &&
        !ref.isAdded &&
        !ref.isDeleted
      );
    });

    const fromApplied = appliedPaths
      .map((path) => ({ path, type: 'blob' }))
      .filter((item) => {
        const file = fileRefs.find((f) => f.path === item.path);
        return file?.origin === 'pr' && (file.isAdded || file.isDeleted);
      });

    return pathsToTreeStructure([...commitedFileRefs, ...fromApplied]);
  }, [fileRefs, appliedPaths, activeIntroPaths]);

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
      <div className="header">
        <span>Explorer</span>
        {isEditing() && (
          <Tooltip title="Highlight multiple files">
            <FontAwesomeIcon
              icon={faSquareCheck}
              className="cursor-pointer"
              onClick={() => {
                setIsCheckable(!isCheckable);
                if (!isCheckable) {
                  setCheckedPaths([]);
                }
              }}
            />
          </Tooltip>
        )}
      </div>
      <ForwardDirectoryTree
        checkable={isCheckable}
        checkedKeys={checkedPaths}
        ref={treeRef}
        className="grow overflow-auto"
        treeData={treeData}
        switcherIcon={<span></span>}
        icon={getIcon}
        multiple
        selectedKeys={
          activeStep?.highlightPaths?.length && !activeStep.isDraft
            ? activeStep.highlightPaths
            : [activeFile?.path || '']
        }
        expandedKeys={expanded}
        onCheck={(checked) => {
          setCheckedPaths(checked);
          if (activeFile) {
            saveDelta({
              delta: new Delta(),
              file: activeFile,
              highlightPaths: checked as string[],
              highlight: [],
            });
          }
        }}
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
              setActiveStepId(null);
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
