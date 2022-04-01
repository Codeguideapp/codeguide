import React, { useCallback, useEffect } from 'react';
import Split from 'react-split';
import useSWR from 'swr';

import { getFiles } from '../api/api';
import { Editor } from '../Editor/Editor';
import { FileTree } from '../FileTree/FileTree';
import { useStore } from '../store/store';
import { Timeline } from '../Timeline/Timeline';

export function App() {
  const updateStore = useStore(useCallback((state) => state.updateStore, []));
  const addFile = useStore(useCallback((state) => state.addFile, []));
  const { data, error } = useSWR('/0', (url) => getFiles(0));

  useEffect(() => {
    if (!data) return;

    for (const file of data) {
      addFile(file);
    }
  }, [data, addFile]);

  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;

  return (
    <Split
      className="split"
      direction="vertical"
      gutterSize={2}
      snapOffset={10}
      style={{ height: '100%' }}
      sizes={[70, 30]}
      minSize={[100, 100]}
      onDrag={([top, bottom]) =>
        updateStore((store) => {
          store.layoutSplitRatioTop = top;
          store.layoutSplitRatioBottom = bottom;
        })
      }
    >
      <Split
        className="split-horiz"
        direction="horizontal"
        sizes={[20, 80]}
        gutterSize={2}
      >
        <FileTree />
        <div
          style={{
            overflow: 'hidden',
            width: '100%',
            height: '100%',
          }}
        >
          <Editor />
        </div>
      </Split>

      <Timeline />
    </Split>
  );
}
