import React, { useCallback, useEffect } from 'react';

import { Editor } from '../Editor/Editor';
import { useStore } from '../store/store';
import { Timeline } from '../Timeline/Timeline';

export function App() {
  const initFile = useStore(useCallback((state) => state.initFile, []));

  useEffect(() => {
    initFile('test.ts');
  });

  return (
    <div>
      <div className="main">
        <Editor />
        <div>a</div>
      </div>
      <Timeline />
    </div>
  );
}
