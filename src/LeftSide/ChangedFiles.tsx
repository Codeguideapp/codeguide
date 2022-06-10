import { Tree } from 'antd';
import { DataNode } from 'antd/lib/tree';
import { useAtom } from 'jotai';
import React, { useMemo, useState } from 'react';
import useSWR from 'swr';

import { getFiles } from '../api/api';
import { activeChangeIdAtom, changesAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { setPlayheadXAtom } from '../atoms/playhead';

const { DirectoryTree } = Tree;

export function ChangedFiles() {
  const [activeFile, setActiveFile] = useAtom(activeFileAtom);
  const [changes] = useAtom(changesAtom);
  // const [fileChanges] = useAtom(fileChangesAtom);
  // const [changesOrder] = useAtom(changesOrderAtom);
  const [activeChangeId] = useAtom(activeChangeIdAtom);
  const [, setPlayheadX] = useAtom(setPlayheadXAtom);
  const [activeDir] = useState('/');

  // const hiddenFiles = useMemo(() => {
  //   const appliedIds = activeChangeId
  //     ? changesOrder.slice(0, changesOrder.indexOf(activeChangeId) + 1)
  //     : [];

  //   let isFileAdded: Record<string, boolean> = {};
  //   for (const file of fileChanges) {
  //     const { path, status } = file;
  //     isFileAdded[path] = status === 'modified' || status === 'deleted';
  //   }

  //   for (const id of appliedIds) {
  //     const { path, fileStatus } = changes[id];
  //     isFileAdded[path] = fileStatus === 'modified' || fileStatus === 'added';
  //   }

  //   return isFileAdded;
  // }, [fileChanges, changesOrder, changes, activeChangeId]);

  const { data } = useSWR(activeDir, () => getFiles(0));

  const modifiedFiles = useMemo(() => {
    const treeData: DataNode[] = [];

    for (const file of data || []) {
      const last = file.path.split('/').pop();
      treeData.push({
        key: file.path,
        title: last,
        isLeaf: true,
      });
    }

    return treeData;
  }, [data]);

  // const directory = useMemo(() => {
  //   return modifiedFiles.filter((file) => hiddenFiles[file.key]);
  // }, [modifiedFiles, hiddenFiles]);

  if (!data) {
    return <div className="file-tree">loading...</div>;
  }

  return (
    <div className="file-tree">
      {/* <div>directory</div>
      <br />
      <DirectoryTree
        treeData={directory}
        onSelect={(selected) => {
          const file = data.find((f) => f.path === selected[0]);
          setActiveFile(file);
          setPlayheadX({
            x: Infinity,
            type: 'ref',
          });
        }}
      /> 
     */}
      <div className="header">Changed files</div>
      <DirectoryTree
        className="directory-tree"
        treeData={modifiedFiles}
        activeKey={
          activeChangeId ? changes[activeChangeId].path : activeFile?.path
        }
        selectedKeys={
          activeChangeId
            ? [changes[activeChangeId].path]
            : [activeFile?.path || '']
        }
        onSelect={(selected) => {
          const file = data.find((f) => f.path === selected[0]);
          setActiveFile(file);
          setPlayheadX({
            x: Infinity,
            type: 'ref',
          });
        }}
      />
    </div>
  );
}
