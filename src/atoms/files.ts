import produce from 'immer';
import { atom } from 'jotai';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { File } from '../api/api';
import { changesAtom, changesOrderAtom } from './changes';
import { setPlayheadXAtom } from './playhead';

export const activePathAtom = atom<string | undefined>(undefined);

export const addFileAtom = atom(null, (get, set, file: File) => {
  const changes = get(changesAtom);
  const changesOrder = get(changesOrderAtom);

  const id = nanoid();

  const newChangesOrder = [...changesOrder, id];

  const newChanges = produce(changes, (changesDraft) => {
    changesDraft[id] = {
      type: 'added',
      originalVal: file.oldVal,
      id,
      actions: {},
      color: '#0074bb',
      delta: new Delta().insert(file.oldVal),
      deltaInverted: new Delta(),
      deps: [],
      path: file.path,
      width: 50,
      x: 0,
    };

    let x = 10;
    for (const id of newChangesOrder) {
      changesDraft[id].x = x;
      x += changesDraft[id].width + 10;
    }
  });

  set(changesAtom, newChanges);
  set(changesOrderAtom, newChangesOrder);
  set(setPlayheadXAtom, Infinity);
});
