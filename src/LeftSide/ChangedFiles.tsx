import { Tree } from 'antd';
import { DataNode } from 'antd/lib/tree';
import { useAtom } from 'jotai';
import React, { useMemo } from 'react';

import {
  activeFileAtom,
  fileChangesAtom,
  setFileByPathAtom,
} from '../atoms/files';
import { toggleBackToEditButtonAtom } from '../atoms/layout';

const { DirectoryTree } = Tree;

export function ChangedFiles() {
  const [activeFile] = useAtom(activeFileAtom);
  const [, setFileByPath] = useAtom(setFileByPathAtom);
  const [fileChanges] = useAtom(fileChangesAtom);
  const [, toggleBacktoEditButton] = useAtom(toggleBackToEditButtonAtom);

  const treeData = useMemo(() => {
    const treeData: DataNode[] = [];

    for (const file of fileChanges || []) {
      const filename = file.path.split('/').pop();

      treeData.push({
        key: file.path,
        title: filename,
        isLeaf: true,
      });
    }

    return treeData;
  }, [fileChanges]);

  if (!fileChanges || fileChanges.length === 0) {
    return <div className="file-tree">loading...</div>;
  }

  return (
    <div className="file-tree" onClick={toggleBacktoEditButton}>
      <div className="header">
        <span className="title">Changed files</span>
      </div>
      <DirectoryTree
        className="directory-tree"
        treeData={treeData}
        activeKey={activeFile?.path}
        selectedKeys={[activeFile?.path || '']}
        onSelect={(selected) => {
          setFileByPath(selected[0] as string);
        }}
      />
    </div>
  );
}
