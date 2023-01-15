import { Tree } from 'antd';
import { DataNode } from 'antd/lib/tree';
import React, { useMemo } from 'react';

import { useFilesStore } from '../store/files';

const { DirectoryTree } = Tree;

export function ChangedFiles() {
  const fileNodes = useFilesStore((s) => s.fileNodes);
  const activeFile = useFilesStore((s) => s.activeFile);
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);

  const treeData = useMemo(() => {
    const treeData: DataNode[] = [];

    for (const file of fileNodes || []) {
      if (!file.isFileDiff) continue;

      const filename = file.path.split('/').pop();

      treeData.push({
        key: file.path,
        title: filename,
        isLeaf: true,
      });
    }

    return treeData;
  }, [fileNodes]);

  if (!fileNodes || fileNodes.length === 0) {
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
