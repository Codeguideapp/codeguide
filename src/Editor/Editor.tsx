import { useAtom } from 'jotai';
import React from 'react';

import { activeFileAtom } from '../atoms/files';
import { canEditAtom } from '../atoms/playhead';
import { EditorEditMode } from './EditorEditMode';
import { EditorReadMode } from './EditorReadMode';

export function Editor() {
  const [canEdit] = useAtom(canEditAtom);
  const [activeFile] = useAtom(activeFileAtom);
  const path = activeFile?.path || '';

  return (
    <div className="main-right">
      <div className="editor-top">
        <span className="filename">{path.split('/').pop()}</span>
      </div>
      <div className="editor-bottom">
        {canEdit ? <EditorEditMode /> : <EditorReadMode />}
      </div>
    </div>
  );
}
