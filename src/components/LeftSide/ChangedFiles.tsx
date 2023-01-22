import { Tree } from 'antd';
import { DataNode } from 'antd/lib/tree';
import React, { useMemo } from 'react';

import { useFilesStore } from '../store/files';
import { useGuideStore } from '../store/guide';

const { DirectoryTree } = Tree;

export function ChangedFiles() {
  const changedFileRefs = useGuideStore((s) => s.changedFileRefs);
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
      });
    }

    return treeData;
  }, [changedFileRefs]);

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
          setActiveFileByPath(selected[0] as string);
        }}
      />
    </div>
  );
}
