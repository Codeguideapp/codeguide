import produce from 'immer';
import { atom } from 'jotai';
import { uniq } from 'lodash';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { composeDeltas, deltaToString } from '../utils/deltaUtils';
import { getDeltas } from '../utils/getFileContent';
import { changesAtom, changesOrderAtom } from './changes';
import { activeFileAtom } from './files';
import { setPlayheadXAtom } from './playhead';

// todo: find ways to refactor

// calc current taken coordinates:

// insert crvena delta 0 - 5
// delete plava  delta 1 - 3, crvena sad 0 - 2
// insert zelena delta 0 - 2, plava 3 - 5, crvena 2 - 4

// kako transforimat deltu da bude u stanju nakon dep?
// undo do dep,

export const saveDeltaAtom = atom(null, (get, set, delta: Delta) => {
  const newDraftId = nanoid();

  const file = get(activeFileAtom);
  let changes = get(changesAtom);
  let changesOrder = get(changesOrderAtom);

  if (!file) throw new Error('no file is active');

  const isFileFirstChange =
    Object.values(changes).find(({ path }) => path === file.path) === undefined;

  if (
    (file.status === 'modified' || file.status === 'deleted') &&
    isFileFirstChange
  ) {
    // in case this is the first change for a file
    // we need to add an initial "isFileDepChange" change
    const id = nanoid();

    const newChangesOrder = [id, ...changesOrder];
    const newChanges = produce(changes, (changesDraft) => {
      changesDraft[id] = {
        isFileDepChange: true,
        status: 'modified',
        id,
        actions: {},
        color: '#0074bb',
        delta: new Delta().insert(file.oldVal),
        deltaInverted: new Delta(),
        deps: [],
        path: file.path,
        width: 0,
        x: 0,
      };
    });

    set(changesAtom, newChanges);
    set(changesOrderAtom, newChangesOrder);
    changes = get(changesAtom);
    changesOrder = get(changesOrderAtom);
  }

  let changeType = file.status;
  if (file.status === 'added') {
    if (isFileFirstChange) {
      changeType = 'added';
    } else {
      changeType = 'modified';
    }
  } else if (file.status === 'deleted') {
    const deltas = Object.values(changes)
      .filter(({ path }) => path === file.path)
      .map((c) => c.delta);

    if (deltaToString([...deltas, delta]) === '') {
      changeType = 'deleted';
    } else {
      changeType = 'modified';
    }
  }

  const appliedIds = changesOrder.filter(
    (id) => changes[id].path === file.path
  );

  const takenCoordinates = calcCoordinates(
    appliedIds.map((id) => ({
      id,
      delta: changes[id].delta,
    }))
  );

  const deltasToNow = getDeltas({
    changeId: appliedIds[appliedIds.length - 1],
    changes,
    changesOrder: appliedIds,
  });

  const foundDeps = takenCoordinates
    .filter((taken) => {
      // first transforming draft to the point when "taken" was applied
      const toUndo = deltasToNow.slice(
        deltasToNow.findIndex((d) => d.id === taken.id) + 1
      );

      let draftTransformed = delta;
      for (const { delta } of toUndo) {
        const undoChange = delta.invert(new Delta());
        draftTransformed = undoChange.transform(draftTransformed);
      }

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

  // todo: refactor
  const toUndo = idsToUndo
    .map((id) => deltasToNow.find((d) => d.id === id))
    .sort((a, b) => {
      return (
        calcCoordinates([{ delta: a!.delta, id: 'a' }])[0].from -
        calcCoordinates([{ delta: b!.delta, id: 'b' }])[0].from
      );
    })
    .map((r) => r!.id);

  const baseComposed = composeDeltas(baseIds.map((id) => changes[id].delta));

  let draftChangeTransformed = delta;
  for (const idToUndo of toUndo) {
    const undoChange = changes[idToUndo].delta.invert(baseComposed);
    draftChangeTransformed = undoChange.transform(draftChangeTransformed);
  }

  const newChangesOrder = [...changesOrder, newDraftId];

  const newChanges = produce(changes, (changesDraft) => {
    changesDraft[newDraftId] = {
      isFileDepChange: false,
      status: changeType,
      id: newDraftId,
      color: changeType === 'modified' ? '#374957' : '#0074bb',
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
      path: file.path,
      delta: draftChangeTransformed,
      deltaInverted: draftChangeTransformed.invert(baseComposed),
    };

    let x = 10;
    for (const id of newChangesOrder) {
      if (changesDraft[id].isFileDepChange) {
        continue;
      }
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
            const toReturn = {
              id,
              from: index,
              to: index + op.delete,
              op: 'delete',
            };
            index -= op.delete;
            return toReturn;
          } else if (typeof op.insert === 'string') {
            const toReturn = {
              id,
              from: index,
              to: index + op.insert.length,
              op: 'insert',
            };
            index += op.insert.length;
            return toReturn;
          }
          return null;
        })
        .filter((op) => op !== null);
    })
    .flat() as Coordinate[];
}
