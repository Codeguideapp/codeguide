import * as Diff from 'diff';
import { DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT } from 'diff-match-patch';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { diff_charMode, diff_lineMode } from './diffMatchPatch';

export interface DiffMarker {
  type?: 'indent';
  id: string;
  changeId?: string;
  length: number;
  modifiedOffset: number;
  originalOffset: number;
  operation: 'replace' | 'insert' | 'delete';
  equivalentReplaceMarker?: DiffMarker;
  delta: Delta;
  stat: [number, number];
  value: string;
  preview?: Record<
    number,
    {
      isDelete: boolean;
      code: string;
    }[]
  >;
}
export type DiffMarkers = Record<string, DiffMarker>;

type DiffLine = {
  operation: 'retain' | 'insert' | 'delete' | 'replace';
  orgLine: number;
  modLine: number;
  original?: string;
  modified?: string;
};

export function getDiffMarkers(params: {
  modifiedValue: string;
  originalValue: string;
  eol: string;
}) {
  const diff = Diff.diffTrimmedLines(
    params.modifiedValue,
    params.originalValue
  );

  const modifiedLines = params.modifiedValue.split(params.eol);
  const originalLines = params.originalValue.split(params.eol);
  const diffLines: DiffLine[] = [];
  let orgLine = 0;
  let modLine = 0;

  let lastRes:
    | {
        operation: 'retain' | 'insert' | 'delete' | 'replace';
        diffLinesIndexFrom: number;
        diffLinesIndexTo: number;
      }
    | undefined;

  for (const { added, removed, count } of diff) {
    if (count === undefined) {
      throw new Error('unexpected diff res');
    }

    const currentRes: typeof lastRes = {
      operation: added ? 'insert' : removed ? 'delete' : 'retain',
      diffLinesIndexFrom: diffLines.length,
      diffLinesIndexTo: diffLines.length + count - 1,
    };

    for (let chunkLine = 0; chunkLine < count; chunkLine++) {
      if (added) {
        orgLine++;

        if (
          lastRes?.operation === 'delete' &&
          lastRes.diffLinesIndexFrom + chunkLine <= lastRes.diffLinesIndexTo
        ) {
          diffLines[lastRes.diffLinesIndexFrom + chunkLine] = {
            ...diffLines[lastRes.diffLinesIndexFrom + chunkLine],
            operation: 'replace',
            orgLine,
            original: originalLines[orgLine - 1],
          };
        } else {
          diffLines.push({
            operation: 'insert',
            orgLine,
            modLine: -1,
            original: originalLines[orgLine - 1],
            modified: undefined,
          });
        }
      } else if (removed) {
        modLine++;

        diffLines.push({
          operation: 'delete',
          orgLine: -1,
          modLine,
          modified: modifiedLines[modLine - 1],
          original: undefined,
        });
      } else {
        orgLine++;
        modLine++;

        diffLines.push({
          operation: 'retain',
          orgLine,
          modLine,
          original: originalLines[orgLine - 1],
          modified: modifiedLines[modLine - 1],
        });
      }
    }

    lastRes = currentRes;
  }

  let markers: DiffMarkers = {};

  const grouped: {
    operation: 'retain' | 'insert' | 'delete' | 'replace';
    lines: DiffLine[];
  }[] = [];

  for (const line of diffLines) {
    if (grouped[grouped.length - 1]?.operation === line.operation) {
      grouped[grouped.length - 1]?.lines.push(line);
    } else {
      grouped.push({
        operation: line.operation,
        lines: [line],
      });
    }
  }

  let modifiedOffset = 0;
  let originalOffset = 0;

  for (let groupIndex = 0; groupIndex < grouped.length; groupIndex++) {
    const group = grouped[groupIndex];
    if (!group) continue;

    if (group.operation === 'retain') {
      for (const line of grouped[groupIndex].lines) {
        if (typeof line.original === 'string') {
          originalOffset += line.original.length + params.eol.length;
        }
        if (typeof line.modified === 'string') {
          modifiedOffset += line.modified.length + params.eol.length;
        }
      }
    } else if (group.operation === 'insert') {
      const value = group.lines.reduce(
        (acc, curr) => acc + curr.original! + params.eol,
        ''
      );
      const id = nanoid();
      markers[id] = {
        id,
        modifiedOffset,
        originalOffset,
        operation: 'insert',
        length: value.length,
        stat: [value.length, 0],
        value,
        delta: new Delta(
          new Delta([{ retain: modifiedOffset }, { insert: value }])
        ),
      };

      for (const line of grouped[groupIndex].lines) {
        if (typeof line.original === 'string') {
          originalOffset += line.original.length + params.eol.length;
        }
        if (typeof line.modified === 'string') {
          modifiedOffset += line.modified.length + params.eol.length;
        }
      }
    } else if (group.operation === 'delete') {
      const value = group.lines.reduce(
        (acc, curr) => acc + curr.modified! + params.eol,
        ''
      );
      const id = nanoid();
      markers[id] = {
        id,
        modifiedOffset,
        originalOffset,
        operation: 'delete',
        length: value.length,
        stat: [0, value.length],
        value,
        delta: new Delta(
          new Delta([{ retain: modifiedOffset }, { delete: value.length }])
        ),
      };

      for (const line of grouped[groupIndex].lines) {
        if (typeof line.original === 'string') {
          originalOffset += line.original.length + params.eol.length;
        }
        if (typeof line.modified === 'string') {
          modifiedOffset += line.modified.length + params.eol.length;
        }
      }
    } else if (group.operation === 'replace') {
      let modifiedBlock = [];
      let originalBlock = [];

      const lines = group.lines;

      if (
        grouped[groupIndex + 1] &&
        (grouped[groupIndex + 1]?.operation === 'delete' ||
          grouped[groupIndex + 1]?.operation === 'insert')
      ) {
        lines.push(...grouped[groupIndex + 1].lines);
        groupIndex++; // skiping next group
      }

      for (const lineInBlock of lines) {
        if (typeof lineInBlock.modified === 'string') {
          modifiedBlock.push(lineInBlock.modified);
        }
        if (typeof lineInBlock.original === 'string') {
          originalBlock.push(lineInBlock.original);
        }
      }

      let lineMarkers = getDiffMarkersDMP({
        modifiedValue: modifiedBlock.join(params.eol),
        originalValue: originalBlock.join(params.eol),
        modOffset: modifiedOffset,
        orgOffset: originalOffset,
      });

      for (const marker of Object.values(lineMarkers)) {
        if (marker.operation !== 'replace') continue;

        if (isMultineDelta(marker.delta, params.modifiedValue, params.eol)) {
          lineMarkers = getDiffMarkersDMP({
            modifiedValue: modifiedBlock.join(params.eol),
            originalValue: originalBlock.join(params.eol),
            modOffset: modifiedOffset,
            orgOffset: originalOffset,
            mode: 'line',
            skipReplace: false,
          });
          break;
        }
      }

      markers = {
        ...markers,
        ...lineMarkers,
      };

      for (const lineInBlock of lines) {
        if (typeof lineInBlock.original === 'string') {
          originalOffset += lineInBlock.original.length + params.eol.length;
        }
        if (typeof lineInBlock.modified === 'string') {
          modifiedOffset += lineInBlock.modified.length + params.eol.length;
        }
      }
    }
  }

  createIndentMarkers(
    markers,
    params.modifiedValue,
    diffLines,
    params.eol,
    ' '
  );
  createIndentMarkers(
    markers,
    params.modifiedValue,
    diffLines,
    params.eol,
    '\t'
  );
  addMarkerPreview(markers, params.modifiedValue, params.eol);

  return markers;
}

function isMultineDelta(delta: Delta, fileContent: string, eol: string) {
  let index = 0;
  for (const op of delta.ops) {
    if (op.retain !== undefined) {
      index += op.retain;
    } else {
      const value =
        typeof op.insert === 'string'
          ? op.insert
          : op.delete !== undefined
          ? fileContent.slice(index, index + op.delete)
          : '';

      if (value.split(eol).length > 1) {
        const startLineNum = getLineNum(index, fileContent, eol);
        const endLineNum = startLineNum + value.split(eol).length - 1;

        return { value, startLineNum, endLineNum };
      }

      if (typeof op.insert === 'string') {
        index += op.insert.length;
      }
    }
  }

  return false;
}

function createIndentMarkers(
  markers: DiffMarkers,
  fileContent: string,
  diffLines: DiffLine[],
  eol: string,
  indentChar: string
) {
  let modifiedOffset = 0;
  let originalOffset = 0;

  let insIndent = {
    modifiedOffset,
    originalOffset,
    value: '',
    delta: new Delta(),
  };
  let delIndent = {
    modifiedOffset,
    originalOffset,
    value: '',
    delta: new Delta(),
  };

  for (const line of diffLines) {
    if (
      typeof line.original === 'string' &&
      typeof line.modified === 'string'
    ) {
      const lineMarkers = getDiffMarkersDMP({
        modifiedValue: line.modified.replace(/^[\t ]+/, ''),
        originalValue: line.original.replace(/^[\t ]+/, ''),
        modOffset: 0,
        orgOffset: 0,
      });

      const hasMarkerOnStart = Object.values(lineMarkers).find(
        (m) => m.modifiedOffset === 0
      );
      if (!hasMarkerOnStart) {
        const re = new RegExp(`^${indentChar}+`);
        const modifiedLeft = line.modified.match(re)?.[0] || '';
        const originalLeft = line.original.match(re)?.[0] || '';

        if (modifiedLeft.length < originalLeft.length) {
          const length = originalLeft.length - modifiedLeft.length;

          insIndent = {
            delta: insIndent.delta.compose(
              new Delta([
                { retain: modifiedOffset },
                { insert: indentChar.repeat(length) },
              ])
            ),
            value: indentChar.repeat(length),
            modifiedOffset,
            originalOffset,
          };
        } else if (modifiedLeft.length > originalLeft.length) {
          const length = modifiedLeft.length - originalLeft.length;

          delIndent = {
            delta: delIndent.delta.compose(
              new Delta([{ retain: modifiedOffset }, { delete: length }])
            ),
            value: indentChar.repeat(length),
            modifiedOffset,
            originalOffset,
          };
        }
      }
    }
    if (typeof line.original === 'string') {
      originalOffset += line.original.length + eol.length;
    }
    if (typeof line.modified === 'string') {
      modifiedOffset += line.modified.length + eol.length;
    }
  }

  if (insIndent.delta.ops.length) {
    const length = insIndent.delta.ops.reduce((acc, curr) => {
      if (typeof curr.insert === 'string') {
        return acc + curr.insert.length;
      } else {
        return acc;
      }
    }, 0);

    const id = nanoid();
    markers[id] = {
      type: 'indent',
      id,
      modifiedOffset: insIndent.modifiedOffset,
      originalOffset: insIndent.originalOffset,
      value: insIndent.value,
      operation: 'insert',
      length: length,
      stat: [length, 0],
      delta: insIndent.delta,
    };
  }
  if (delIndent.delta.ops.length) {
    const length = delIndent.delta.ops.reduce((acc, curr) => {
      if (curr.delete) {
        return acc + curr.delete;
      } else {
        return acc;
      }
    }, 0);

    const id = nanoid();
    markers[id] = {
      type: 'indent',
      id,
      modifiedOffset: delIndent.modifiedOffset,
      originalOffset: delIndent.originalOffset,
      value: delIndent.value,
      operation: 'delete',
      length,
      stat: [0, length],
      delta: delIndent.delta,
    };
  }
}

function getDiffMarkersDMP({
  modifiedValue,
  originalValue,
  modOffset,
  orgOffset,
  mode,
  skipReplace,
}: {
  modOffset: number;
  orgOffset: number;
  modifiedValue: string;
  originalValue: string;
  mode?: 'char' | 'line';
  skipReplace?: boolean;
}) {
  const diffs =
    mode === 'line'
      ? diff_lineMode(modifiedValue, originalValue)
      : diff_charMode(modifiedValue, originalValue);

  const markers: DiffMarkers = {};
  let modifiedOffset = modOffset;
  let originalOffset = orgOffset;
  let i = 0;
  for (const [type, value] of diffs) {
    const prev = diffs[i - 1];
    const next = diffs[i + 1];

    if (type === DIFF_EQUAL) {
      modifiedOffset += value.length;
      originalOffset += value.length;
    } else if (type === DIFF_DELETE) {
      const id = nanoid();

      if (next?.[0] === DIFF_INSERT) {
        // delete + insert = replace, skip it
      } else if (value.length) {
        // only delete
        markers[id] = {
          id,
          modifiedOffset,
          originalOffset,
          operation: 'delete',
          length: value.length,
          value: value,
          stat: [0, value.length],
          delta: new Delta([
            { retain: modifiedOffset },
            { delete: value.length },
          ]),
        };

        modifiedOffset += value.length;
      }
    } else if (type === DIFF_INSERT && value.length !== 0) {
      const id = nanoid();

      if (prev?.[0] === DIFF_DELETE) {
        const replaceMarker: DiffMarker = {
          id,
          modifiedOffset,
          originalOffset,
          operation: 'replace',
          length: value.length,
          value,
          stat: [value.length, prev[1].length],
          delta: new Delta([
            { retain: modifiedOffset },
            { delete: prev[1].length },
            { insert: value },
          ]),
        };

        if (!skipReplace) {
          markers[id] = replaceMarker;
        } else {
          const idIns = nanoid();
          const idDel = nanoid();
          markers[idIns] = {
            equivalentReplaceMarker: replaceMarker,
            id: idIns,
            modifiedOffset,
            originalOffset,
            operation: 'insert',
            length: value.length,
            value,
            stat: [value.length, 0],
            delta: new Delta([{ retain: modifiedOffset }, { insert: value }]),
          };

          markers[idDel] = {
            equivalentReplaceMarker: replaceMarker,
            id: idDel,
            modifiedOffset,
            originalOffset,
            operation: 'delete',
            length: prev[1].length,
            value: prev[1],
            stat: [0, prev[1].length],
            delta: new Delta([
              { retain: modifiedOffset },
              { delete: prev[1].length },
            ]),
          };
        }

        modifiedOffset += prev[1].length;
        originalOffset += value.length;
      } else {
        markers[id] = {
          id,
          modifiedOffset,
          originalOffset,
          operation: 'insert',
          value,
          length: value.length,
          stat: [value.length, 0],
          delta: new Delta([
            {
              retain: modifiedOffset,
            },
            { insert: value },
          ]),
        };
        originalOffset += value.length;
      }
    }
    i++;
  }

  return markers;
}

function addMarkerPreview(
  markers: DiffMarkers,
  modifiedValue: string,
  eol: string
) {
  for (const [, marker] of Object.entries(markers)) {
    const preview: DiffMarker['preview'] = {};

    let index = 0;
    for (const op of marker.delta.ops) {
      if (op.retain !== undefined) {
        index += op.retain;
      } else {
        const value =
          typeof op.insert === 'string'
            ? op.insert
            : op.delete !== undefined
            ? modifiedValue.slice(index, index + op.delete)
            : '';

        const startLineNum = getLineNum(index, modifiedValue, eol);
        const endLineNum = startLineNum + value.split(eol).length - 1;
        const valueSplitted = value.split(eol);

        for (let lineNum = startLineNum; lineNum <= endLineNum; lineNum++) {
          const lineContent = valueSplitted[lineNum - startLineNum];
          if (!lineContent) continue;

          let code =
            marker.type === 'indent'
              ? '▶'.repeat(marker.value?.length || 0)
              : lineContent;

          if (!preview[lineNum]) {
            preview[lineNum] = [];
          }
          preview[lineNum].push({ isDelete: op.delete !== undefined, code });
        }

        if (typeof op.insert === 'string') {
          index += op.insert.length;
        }
      }
    }
    const previewLines = Object.keys(preview);
    if (previewLines.length > 3) {
      const toRemove = previewLines.splice(2, previewLines.length - 3);
      for (const line of toRemove) {
        delete preview[Number(line)];
      }
    }

    marker.preview = preview;
  }
}

function getLineNum(index: number, modifiedValue: string, eol: string): number {
  return modifiedValue.slice(0, index).split(eol).length;
}
