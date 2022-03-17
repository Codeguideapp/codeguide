import * as diffLib from 'diff';
import Delta from 'quill-delta';
import * as Y from 'yjs';

export type Command =
  | {
      type: 'insert';
      value: string;
      index: number;
    }
  | {
      type: 'replace';
      value: string;
      oldValue: string;
      index: number;
    }
  | {
      type: 'delete';
      index: number;
      delLength: number;
    };

type DiffChunk = {
  count?: number;
  value: string;
  added?: boolean;
  removed?: boolean | undefined;
  replace?: string;
};

export function diff(oldVal: string, newVal: string): DiffChunk[] {
  const diffs = diffLib.diffChars(oldVal, newVal) as (DiffChunk & {
    _skip?: boolean;
  })[];

  const diffsWithReplace = diffs.map((diff, index, all) => {
    if (diff._skip) {
      return false;
    }

    if (diff.removed && all[index + 1]?.added) {
      all[index + 1]._skip = true;

      return {
        removed: true,
        replace: all[index + 1].value,
        value: diff.value,
      };
    }

    return diff;
  });

  const changes: DiffChunk[] = [];
  diffsWithReplace.forEach((val) => {
    if (val) {
      changes.push(val);
    }
  });

  return changes;
}

export function createCommands(changes: DiffChunk[]): Command[] {
  const commands: Command[] = [];
  let index = 0;

  for (const change of changes) {
    if (!change) continue;

    if (change.added) {
      commands.push({
        type: 'insert',
        value: change.value,
        index,
      });
    } else if (change.removed) {
      if (change.replace) {
        commands.push({
          type: 'replace',
          index,
          oldValue: change.value,
          value: change.replace,
        });
      } else {
        commands.push({
          type: 'delete',
          index,
          delLength: change.value.length,
        });
      }

      index += change.value.length;
    } else {
      index += change.value.length;
    }
  }

  return commands;
}

export function executeCommands(commands: Command[], initialValue: string) {
  const initial = createYText(initialValue);
  const targetYText = createYText(initial);

  for (const command of commands) {
    const changeYText = createYText(initial);

    switch (command.type) {
      case 'insert':
        changeYText.insert(command.index, command.value);
        break;
      case 'replace':
        changeYText.delete(command.index, command.oldValue.length);
        changeYText.insert(command.index, command.value);
        break;
      case 'delete':
        changeYText.delete(command.index, command.delLength);
        break;
    }

    sync(targetYText, changeYText);
  }

  return targetYText;
}

export function executeDeltas(deltas: Delta[], initialValue: string) {
  const initial = createYText(initialValue);
  const targetYText = createYText(initial);

  for (const delta of deltas) {
    const changeYText = createYText(initial);
    changeYText.applyDelta(delta.ops);
    sync(targetYText, changeYText);
  }

  return targetYText;
}

export function sync(ytext1: Y.Text, ytext2: Y.Text) {
  const ydoc1 = ytext1.doc;
  const ydoc2 = ytext2.doc;

  if (!ydoc1 || !ydoc2) {
    throw new Error('missing y.doc instance');
  }
  const state1 = Y.encodeStateAsUpdate(ydoc1);
  const state2 = Y.encodeStateAsUpdate(ydoc2);

  Y.applyUpdate(ydoc1, state2);
  Y.applyUpdate(ydoc2, state1);
}

export const createYText = (initial: Y.Text | string) => {
  const doc = new Y.Doc();
  const ytext = doc.getText('file');

  if (typeof initial === 'string') {
    ytext.insert(0, initial);
  } else {
    sync(ytext, initial);
  }

  return ytext;
};
