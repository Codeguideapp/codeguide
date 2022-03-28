import React, { useCallback, useEffect } from 'react';
import Split from 'react-split';

import { Editor } from '../Editor/Editor';
import { useStore } from '../store/store';
import { Timeline } from '../Timeline/Timeline';

export function App() {
  const initFile = useStore(useCallback((state) => state.initFile, []));
  const updateStore = useStore(useCallback((state) => state.updateStore, []));

  // @ts-ignore
  window.iin = initFile;

  useEffect(() => {
    initFile('test.ts');
  });

  return (
    <Split
      className="split"
      direction="vertical"
      gutterSize={5}
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
      <div
        style={{
          overflow: 'hidden',
          width: '100%',
          height: '100%',
        }}
      >
        <Editor />
      </div>
      <Timeline />
    </Split>
  );
}
