import { useAtom } from 'jotai';
import React, { useMemo, useState } from 'react';
import useSWR from 'swr';

import { getFiles } from '../api/api';
import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
} from '../atoms/changes';
import { activeFileAtom, fileChangesAtom, stageFileAtom } from '../atoms/files';

export function FileTree() {
  const [, setActiveFile] = useAtom(activeFileAtom);
  const [changes] = useAtom(changesAtom);
  const [, stageFile] = useAtom(stageFileAtom);
  const [fileChanges] = useAtom(fileChangesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [activeChangeId] = useAtom(activeChangeIdAtom);
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
  const modifiedFiles = data;

  const dirFiles = useMemo(() => {
    return data?.filter((file) => hiddenFiles[file.path]);
  }, [data, hiddenFiles]);

  if (!data) {
    return <div>loading...</div>;
  }

  return (
    <div>
      <div>directory</div>
      <ul>
        {dirFiles?.map((file) => {
          return (
            <li key={file.path} onClick={() => setActiveDir(file.path)}>
              {file.path}
            </li>
          );
        })}
      </ul>
      <div>changed files</div>
      <ul>
        {modifiedFiles?.map((file) => {
          switch (file.type) {
            case 'modified':
              return (
                <li
                  onClick={() => {
                    if (
                      !Object.values(changes).find((c) => c.path === file.path)
                    ) {
                      stageFile({ file, isFileDepChange: true });
                    }

                    setActiveFile(file);
                  }}
                  key={file.path}
                >
                  {file.path}
                </li>
              );
            default:
              return (
                <li key={file.path}>
                  <span
                    onClick={() => {
                      if (
                        !Object.values(changes).find(
                          (c) => c.path === file.path
                        )
                      ) {
                        stageFile({ file });
                      }

                      setActiveFile(file);
                    }}
                  >
                    +
                  </span>
                  include {file.path}
                </li>
              );
          }
        })}
      </ul>
    </div>
  );
}
