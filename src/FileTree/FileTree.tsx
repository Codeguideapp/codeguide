import { Tree } from 'antd';
import { DataNode } from 'antd/lib/tree';
import { useAtom } from 'jotai';
import React, { useMemo, useState } from 'react';
import useSWR from 'swr';

import { getFiles } from '../api/api';
import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
} from '../atoms/changes';
import { activeFileAtom, fileChangesAtom } from '../atoms/files';
import { setPlayheadXAtom } from '../atoms/playhead';

const { DirectoryTree } = Tree;

export function FileTree() {
  const [, setActiveFile] = useAtom(activeFileAtom);
  const [changes] = useAtom(changesAtom);
  const [fileChanges] = useAtom(fileChangesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [activeChangeId] = useAtom(activeChangeIdAtom);
  const [, setPlayheadX] = useAtom(setPlayheadXAtom);
  const [activeDir, setActiveDir] = useState('/');

  const hiddenFiles = useMemo(() => {
    const appliedIds = activeChangeId
      ? changesOrder.slice(0, changesOrder.indexOf(activeChangeId) + 1)
      : [];

    let isFileAdded: Record<string, boolean> = {};
    for (const file of fileChanges) {
      const { path, type } = file;
      isFileAdded[path] = type === 'modified' || type === 'deleted';
    }

    for (const id of appliedIds) {
      const { path, type } = changes[id];
      isFileAdded[path] = type === 'modified' || type === 'added';
    }

    return isFileAdded;
  }, [fileChanges, changesOrder, changes, activeChangeId]);

  const { data } = useSWR(activeDir, () => getFiles(0));

  const modifiedFiles = useMemo(() => {
    const treeData: DataNode[] = [];

    for (const file of data || []) {
      treeData.push({
        key: file.path,
        title: file.path,
        isLeaf: true,
      });
    }

    return treeData;
  }, [data]);

  const directory = useMemo(() => {
    return modifiedFiles.filter((file) => hiddenFiles[file.key]);
  }, [modifiedFiles, hiddenFiles]);

  if (!data) {
    return <div>loading...</div>;
  }

  return (
    <div>
      <div>directory</div>
      <br />
      <DirectoryTree
        treeData={directory}
        onSelect={(selected) => {
          const file = data.find((f) => f.path === selected[0]);
          setActiveFile(file);
          setPlayheadX(Infinity);
        }}
      />
      <br />
      <div>changed files</div>
      <br />
      <DirectoryTree
        treeData={modifiedFiles}
        onSelect={(selected) => {
          const file = data.find((f) => f.path === selected[0]);
          setActiveFile(file);
          setPlayheadX(Infinity);
        }}
      />
    </div>
  );
}
