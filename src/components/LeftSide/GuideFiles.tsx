import {
  faChevronDown,
  faChevronRight,
  faFile,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AntdTreeNodeAttribute } from 'antd/lib/tree';
import ForwardDirectoryTree from 'antd/lib/tree/DirectoryTree';
import React, { useState } from 'react';

import { NewFileDialog } from '../dialogs/NewFileDialog';
import { isEditing } from '../store/atoms';
import { useFilesStore } from '../store/files';
import { useStepsStore } from '../store/steps';

export function GuideFiles() {
  const setActiveChangeId = useStepsStore((s) => s.setActiveStepId);
  const activeFile = useFilesStore((s) => s.activeFile);
  const files = useFilesStore((s) =>
    s.fileNodes
      .filter((n) => n.origin === 'virtual')
      .map((node) => ({
        title: node.path.split('/').pop(),
        isLeaf: true,
        key: node.path,
      }))
  );
  const setActiveFileByPath = useFilesStore((s) => s.setActiveFileByPath);
  const addGuideFile = useFilesStore((s) => s.addGuideFile);
  const [dialogVisible, setDialogVisible] = useState(false);

  return (
    <div className="file-tree flex flex-col">
      <div className="header">
        <span>Guide Files</span>
        <span>
          <FontAwesomeIcon
            icon={faPlus}
            className="cursor-pointer"
            onClick={() => {
              setDialogVisible(true);
            }}
          />
        </span>
      </div>
      {files.length === 0 && (
        <div className="file-tree pl-6 pr-2 pt-4">
          Files used only for the guide (not part of the codebase)
        </div>
      )}
      <ForwardDirectoryTree
        className="my-2 h-28 overflow-auto"
        treeData={files}
        switcherIcon={<span></span>}
        icon={getIcon}
        selectedKeys={[activeFile?.path || '']}
        onSelect={(selected, info) => {
          const node = info.node as any;

          if (isEditing()) {
            setActiveChangeId(null);
          }
          setActiveFileByPath(node.key);
        }}
      />
      <NewFileDialog
        visible={dialogVisible}
        onCancel={() => {
          setDialogVisible(false);
        }}
        onOk={(ext, displayName) => {
          const path = `.codeguideFiles/${displayName}${ext}`;
          setDialogVisible(false);
          addGuideFile(path);
          setActiveChangeId(null);
          setActiveFileByPath(path);
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
