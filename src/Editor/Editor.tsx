import React from 'react';

import { useStore } from '../store/store';
import { EditorEditMode } from './EditorEditMode';
import { EditorReadMode } from './EditorReadMode';

export function Editor() {
  const canEdit = useStore((state) => state.canEdit);

  return canEdit ? <EditorEditMode /> : <EditorReadMode />;
}
