import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tree } from 'antd';
import { DataNode } from 'antd/lib/tree';
import classNames from 'classnames';
import { useAtom } from 'jotai';
import React, { useMemo } from 'react';

import { DiffMarkers } from '../api/diffMarkers';
import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
} from '../atoms/changes';
import { activeFileAtom, fileChangesAtom } from '../atoms/files';
import { canEditAtom, setPlayheadXAtom } from '../atoms/playhead';

library.add(faCheck);

const { DirectoryTree } = Tree;

export function ChangedFiles() {
  const [activeFile, setActiveFile] = useAtom(activeFileAtom);
  const [changes] = useAtom(changesAtom);
  const [fileChanges] = useAtom(fileChangesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [activeChangeId] = useAtom(activeChangeIdAtom);
  const [canEdit] = useAtom(canEditAtom);
  const [, setPlayheadX] = useAtom(setPlayheadXAtom);

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

  const modifiedFiles = useMemo(() => {
    const treeData: DataNode[] = [];

    const appliedIds = activeChangeId
      ? changesOrder.slice(0, changesOrder.indexOf(activeChangeId) + 1)
      : [];

    const markersPerFile: Record<string, DiffMarkers> = {};
    for (const id of appliedIds) {
      const change = changes[id];
      markersPerFile[change.path] = change.diffMarkers;
    }

    for (const file of fileChanges || []) {
      const markersNumInChanges = markersPerFile[file.path]
        ? Object.keys(markersPerFile[file.path]).length
        : file.totalDiffMarkers;
      const markersNumInFile = Object.keys(file.diffMarkers).length;
      const diffMarkersNum = canEdit ? markersNumInFile : markersNumInChanges;

      const filename = file.path.split('/').pop();
      const percentage = Math.round(
        (1 - diffMarkersNum / file.totalDiffMarkers) * 100
      );
      treeData.push({
        key: file.path,
        title: (
          <span
            className={classNames({
              'tree-file-node': true,
              completed: percentage === 100,
            })}
          >
            <span className="filename">{filename}</span>
            <span className="percentage">{percentage}%</span>
          </span>
        ),
        icon:
          percentage === 100 ? (
            <FontAwesomeIcon color="#35b05f" icon="check" />
          ) : null,
        isLeaf: true,
      });
    }

    return treeData;
  }, [changesOrder, changes, activeChangeId, fileChanges, canEdit]);

  // const directory = useMemo(() => {
  //   return modifiedFiles.filter((file) => hiddenFiles[file.key]);
  // }, [modifiedFiles, hiddenFiles]);

  if (!fileChanges || fileChanges.length === 0) {
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
          const file = fileChanges.find((f) => f.path === selected[0]);
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
