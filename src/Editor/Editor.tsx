import { useAtom } from 'jotai';
import React from 'react';

import { canEditAtom } from '../atoms/playhead';
import { EditorEditMode } from './EditorEditMode';
import { EditorReadMode } from './EditorReadMode';

export function Editor() {
  const [canEdit] = useAtom(canEditAtom);

  return canEdit ? <EditorEditMode /> : <EditorReadMode />;
}
