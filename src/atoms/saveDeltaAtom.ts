import produce from 'immer';
import { atom } from 'jotai';
import { uniq } from 'lodash';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { composeDeltas } from '../utils/deltaUtils';
import { changesAtom, changesOrderAtom } from './changes';
import { activeFileAtom } from './files';
import { setPlayheadXAtom } from './playhead';

export const saveDeltaAtom = atom(null, (get, set, delta: Delta) => {
  const newDraftId = nanoid();

  const changes = get(changesAtom);
  const activeFile = get(activeFileAtom);
  const changesOrder = get(changesOrderAtom);

  if (!activeFile) throw new Error('no file is active');

  const appliedIds = changesOrder.filter(
    (id) => changes[id].path === activeFile.path
  );

  const takenCoordinates = calcCoordinates(
    appliedIds.map((id) => ({
      id,
      delta: changes[id].delta,
    }))
  );

  const foundDeps = takenCoordinates
    .filter((taken) => {
      // first transforming draft to the point when "taken" was applied
      const toUndo = changesOrder.slice(changesOrder.indexOf(taken.id) + 1);

      const toUndoDelta = composeDeltas(
        toUndo.map((id) => changes[id].deltaInverted)
      );
      const draftTransformed = toUndoDelta.transform(delta);
      const draftCoordinates = calcCoordinates([
        {
          id: newDraftId,
          delta: draftTransformed,
        },
      ]);

      return draftCoordinates.find((draft) => {
        // check if it's overlapping
        if (!taken || !draft) {
          return false;
        }
        if (taken.op === 'insert' && draft.op === 'insert') {
          return taken.to >= draft.from && taken.from <= draft.from;
        }
        return taken.to >= draft.from && taken.from <= draft.to;
      });
    })
    .map(({ id }) => {
      return [...changes[id].deps, id];
    })
    .flat();

  const deps = uniq(foundDeps).sort(
    (a, b) => changesOrder.indexOf(a) - changesOrder.indexOf(b)
  );

  const baseIds = appliedIds.filter((id) => deps.includes(id));
  const idsToUndo = appliedIds.filter((id) => !deps.includes(id));

  const baseComposed = composeDeltas(baseIds.map((id) => changes[id].delta));
  const toUndoComposed = composeDeltas(
    idsToUndo.map((id) => changes[id].delta)
  );
  const undoChanges = toUndoComposed.invert(baseComposed);
  const draftChangeTransformed = undoChanges.transform(delta);

  const newChangesOrder = [...changesOrder, newDraftId];

  const newChanges = produce(changes, (changesDraft) => {
    changesDraft[newDraftId] = {
      type: 'modified',
      id: newDraftId,
      color: '#374957',
      width: 50,
      x: 0,
      actions: {
        discardDraft: {
          label: 'Discard Draft',
          color: 'red',
          callback: () => {},
        },
        saveChanges: {
          label: 'Save Changes',
          color: 'green',
          callback: () => {},
        },
      },
      deps,
      path: activeFile.path,
      delta: draftChangeTransformed,
      deltaInverted: draftChangeTransformed.invert(baseComposed),
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

type Coordinate = {
  from: number;
  to: number;
  id: string;
  op: 'insert' | 'delete';
};

export function calcCoordinates(
  data: { delta: Delta; id: string }[]
): Coordinate[] {
  return data
    .map(({ delta, id }) => {
      let index = 0;
      return delta
        .map((op) => {
          if (op.retain) {
            index += op.retain;
            return null;
          } else if (op.delete) {
            return {
              id,
              from: index,
              to: index + op.delete,
              op: 'delete',
            };
          } else if (typeof op.insert === 'string') {
            return {
              id,
              from: index,
              to: index + op.insert.length,
              op: 'insert',
            };
          }
          return null;
        })
        .filter((op) => op !== null);
    })
    .flat() as Coordinate[];
}
