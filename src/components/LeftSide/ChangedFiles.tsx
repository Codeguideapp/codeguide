import { Tree } from 'antd';
import { DataNode } from 'antd/lib/tree';
import React, { useMemo } from 'react';

import { isEditing } from '../store/atoms';
import { useFilesStore } from '../store/files';
import { useGuideStore } from '../store/guide';
import { useStepsStore } from '../store/steps';
import { FileIcon } from './FileIcon';

const { DirectoryTree } = Tree;

export function ChangedFiles() {
  const type = useGuideStore((s) => s.type);
  const changedFileRefs = useGuideStore((s) =>
    s.fileRefs.filter((ref) => ref.origin === 'pr')
  );
  const setActiveChangeId = useStepsStore((s) => s.setActiveStepId);
  const activeFile = useFilesStore((s) => s.activeFile);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);

  const treeData = useMemo(() => {
    const treeData: DataNode[] = [];

    for (const fileRef of changedFileRefs || []) {
      const filename = fileRef.path.split('/').pop();

      treeData.push({
        key: fileRef.path,
        title: filename,
        isLeaf: true,
        icon: <FileIcon path={fileRef.path} />,
      });
    }

    return treeData;
  }, [changedFileRefs]);

  if (type === 'browse') {
    return (
      <div className="file-tree p-4">
        File changes are available only in code review guides.
      </div>
    );
  }

  if (!changedFileRefs || changedFileRefs.length === 0) {
    return <div className="file-tree">loading...</div>;
  }

  return (
    <div className="file-tree">
      <div className="header">
        <span className="title">Changed files</span>
      </div>
      <DirectoryTree
        className="directory-tree"
        treeData={treeData}
        activeKey={activeFile?.path}
        selectedKeys={[activeFile?.path || '']}
        onSelect={(selected) => {
          if (isEditing()) {
            setActiveChangeId(null);
          }
          setActiveFileByPath(selected[0] as string);
        }}
      />
    </div>
  );
}
