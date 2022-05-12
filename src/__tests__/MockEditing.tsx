import { useAtom } from 'jotai';
import Delta from 'quill-delta';
import { useEffect } from 'react';

import { File } from '../api/api';
import {
  changesAtom,
  changesOrderAtom,
  swapChangesAtom,
} from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { setPlayheadXAtom } from '../atoms/playhead';
import { saveDeltaAtom } from '../atoms/saveDeltaAtom';
import { Changes } from '../atoms/types';

export function MockEditing({
  files,
  activeFile,
  deltas,
  changesToSwap,
  onChangesUpdate,
  onChangesOrderUpdate,
}: {
  files: File[];
  activeFile: string;
  deltas: Delta[];
  changesToSwap?: {
    from: string;
    to: string;
  };
  onChangesUpdate: (changes: Changes) => void;
  onChangesOrderUpdate: (ids: string[]) => void;
}) {
  const [, saveDelta] = useAtom(saveDeltaAtom);
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [, setActiveFile] = useAtom(activeFileAtom);
  const [, setPlayheadX] = useAtom(setPlayheadXAtom);
  const [, swapChanges] = useAtom(swapChangesAtom);

  useEffect(() => {
    const file = files.find((f) => f.path === activeFile);
    setActiveFile(file);
    setPlayheadX(Infinity);
  }, [activeFile, files, setActiveFile, setPlayheadX]);

  useEffect(() => onChangesUpdate(changes), [changes, onChangesUpdate]);
  useEffect(
    () => onChangesOrderUpdate(changesOrder),
    [changesOrder, onChangesOrderUpdate]
  );

  useEffect(() => {
    for (const delta of deltas) {
      saveDelta(delta);
    }
  }, [deltas, saveDelta]);

  useEffect(() => {
    if (changesToSwap) {
      swapChanges(changesToSwap);
    }
  }, [changesToSwap, swapChanges]);

  return null;
}
