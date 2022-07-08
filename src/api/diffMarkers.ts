import { DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT } from 'diff-match-patch';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { deltaToString } from '../utils/deltaUtils';
import { diff_charMode, diff_lineMode } from './diffMatchPatch';
import { mergeTabsInSequence } from './diffMatchPatch';

interface BaseDiffMarker {
  id: string;
  changeId?: string;
  length: number;
  modifiedOffset: number;
  originalOffset: number;
  operation: 'replace' | 'insert' | 'delete';
  delta: Delta;
  stat: [number, number];
  value?: string; // only for simple inserts/deletes
  preview?: Record<
    number,
    {
      isDelete: boolean;
      code: string;
    }[]
  >;
}

interface IndentDiffMarker extends BaseDiffMarker {
  type: 'indent';
}

export type DiffMarker = BaseDiffMarker | IndentDiffMarker;
export type DiffMarkers = Record<string, DiffMarker>;

export const isIndentMarker = (m: DiffMarker): m is IndentDiffMarker => {
  return typeof m === 'object' && 'type' in m && m.type === 'indent';
};

export function getDiffMarkers(params: {
  modifiedValue: string;
  originalValue: string;
  tab: string;
  eol: string;
}) {
  const lineMarkers = getDiffMarkersPerMode({ ...params, mode: 'line' });
  const charMarkers = getDiffMarkersPerMode({ ...params, mode: 'char' });

  const res: DiffMarkers = charMarkers;

  for (const charMarker of Object.values(charMarkers)) {
    if (charMarker.operation !== 'replace') {
      // only check char replace
      continue;
    }

    const charFrom = charMarker.modifiedOffset;
    const charTo = charMarker.modifiedOffset + charMarker.length;

    // check if there are multiple lineMarkers in that range
    const lineMarkersInRange = Object.values(lineMarkers).filter((lm) => {
      const lineFrom = lm.modifiedOffset;
      const lineTo = lm.modifiedOffset + lm.length;

      return (
        (lineFrom < charFrom && lineTo > charFrom) ||
        (lineFrom < charTo && lineTo > charTo) ||
        (lineFrom > charFrom && lineTo < charTo)
      );
    });

    if (lineMarkersInRange.length > 1) {
      // if there are, use that lineMarker and delete char marker
      for (const lineMarker of lineMarkersInRange) {
        res[lineMarker.id] = lineMarker;
      }
      delete res[charMarker.id];
    }
  }

  console.log(res);
  return res;
}

// head-manager.ts ko referenca
// dobivene markere analiziraj i skuži indente
// tab je svaki whitespace ili \t na početku linije (matcha onaj regex)
// ako ga nađeš, treba razbit marker na dijelove whitespacea i non-whitespacea
// ne razbijaj ako se briše cijela linija
// onda whitespace marker stavit na početak linije (jer ionako matcha regex)
// spojit whitespace markere u istoj liniji
// spojit whitespace markere ako su jedan ispod drugog

// side-effect.tsx ko referenca
// nema smisla vezat char diff ins / delete (replace) ako se nešto proteže kroz više linija
// u tom slučaju treba koristit line diff
// char diff je samo za unutar linije
// možda onda treba i pokrenut diff unutar linije? + trim line diffa da ne obuhvaća cijelu ako ne treba

function getDiffMarkersPerMode({
  modifiedValue,
  originalValue,
  tab,
  eol,
  mode,
}: {
  modifiedValue: string;
  originalValue: string;
  tab: string;
  eol: string;
  mode: 'char' | 'line';
}) {
  // todo(optimisation): line mode is calculated from diff chars but it is calulcated separately here
  // result of char diff can probably be reused
  const diffs =
    mode === 'char'
      ? diff_charMode(modifiedValue, originalValue)
      : diff_lineMode(modifiedValue, originalValue);

  mergeTabsInSequence(diffs, tab);

  const markers: DiffMarkers = {};
  let modifiedOffset = 0;
  let originalOffset = 0;
  for (const [type, value] of diffs) {
    //const prev = diffs[i - 1];
    //const next = diffs[i + 1];

    if (type === DIFF_EQUAL) {
      modifiedOffset += value.length;
      originalOffset += value.length;
    } else if (type === DIFF_DELETE) {
      const id = nanoid();

      markers[id] = {
        id,
        modifiedOffset,
        originalOffset,
        value: modifiedValue.slice(
          modifiedOffset,
          modifiedOffset + value.length
        ),
        operation: 'delete',
        length: value.length,
        stat: [0, value.length],
        delta: new Delta([
          { retain: modifiedOffset },
          { delete: value.length },
        ]),
      };

      modifiedOffset += value.length;
    } else if (type === DIFF_INSERT && value.length !== 0) {
      const id = nanoid();
      markers[id] = {
        id,
        modifiedOffset,
        originalOffset,
        operation: 'insert',
        value: value,
        length: value.length,
        stat: [value.length, 0],
        delta: new Delta([{ retain: modifiedOffset }, { insert: value }]),
      };
      originalOffset += value.length;
    }
  }

  //separateTabsAndNewLines(markers, tab, eol);
  //mergeIndents(markers, modifiedValue, originalValue, tab, eol);
  // trimStart(markers, modifiedValue, eol, '\t');
  // trimEnd(markers, modifiedValue, eol, '\t');
  // trimStart(markers, modifiedValue, eol, ' ');
  // trimEnd(markers, modifiedValue, eol, ' ');
  detectIndents(markers, modifiedValue, eol, ' ');
  detectIndents(markers, modifiedValue, eol, '\t');
  mergeIndentsInSameLine(markers, modifiedValue, eol, ' ');
  mergeIndentsInSameLine(markers, modifiedValue, eol, '\t');
  mergeConsecutiveIndents(markers, modifiedValue, eol, ' ');
  mergeConsecutiveIndents(markers, modifiedValue, eol, '\t');
  makeReplaceMarkers(markers);
  addMarkerPreview(markers, modifiedValue, eol);
  return markers;
}

function makeReplaceMarkers(markers: DiffMarkers) {
  const markersArr = Object.values(markers).sort(
    (a, b) => a.originalOffset - b.originalOffset
  );

  let lastMarker: DiffMarker | undefined;
  for (const marker of markersArr) {
    if (
      lastMarker &&
      getDeltaOffset(lastMarker.delta) === marker.modifiedOffset
    ) {
      const id = nanoid();
      markers[id] = {
        id,
        modifiedOffset: lastMarker.modifiedOffset,
        originalOffset: lastMarker.originalOffset,
        operation: 'replace',
        length: marker.length,
        stat: [marker.length, lastMarker.length],
        delta: new Delta([
          { retain: lastMarker.modifiedOffset },
          { delete: lastMarker.length },
          { insert: marker.value },
        ]),
      };
      delete markers[marker.id];
      delete markers[lastMarker.id];
      lastMarker = markers[id];
    } else {
      lastMarker = marker;
    }
  }
}

function getDeltaOffset(delta: Delta) {
  let offset = 0;

  for (const op of delta.ops) {
    if (op.retain) {
      offset += op.retain;
    } else if (typeof op.insert === 'string') {
      offset += op.insert.length;
    } else if (op.delete) {
      offset += op.delete;
    }
  }
  return offset;
}

function trimStart(
  markers: DiffMarkers,
  modifiedValue: string,
  eol: string,
  indentChar: string
) {
  for (const [, marker] of Object.entries(markers)) {
    if (!marker.value) continue;

    const isInsert = marker.operation === 'insert';

    const lineOffset = indexInLineStart(
      modifiedValue,
      marker.modifiedOffset,
      eol
    );

    // starts with indentChar, but doesnt end with indentChar
    const intentAtStart = `^(${indentChar}+)[^${indentChar}]+`;
    const match = marker.value.match(new RegExp(intentAtStart));

    //od lineOffset do marker.modifiedOffset moraju bit whitespace
    const fromLineStartToMarker = modifiedValue.slice(
      lineOffset,
      marker.modifiedOffset
    );

    if (
      match &&
      fromLineStartToMarker.match(new RegExp(`^${indentChar}+$`)) &&
      !marker.value.endsWith(eol) // is not entire line
    ) {
      const trimmed = match[1];

      marker.value = marker.value.slice(trimmed.length);

      const oldModOffset = marker.modifiedOffset;
      const oldOrgOffset = marker.originalOffset;
      const newModOffset = marker.modifiedOffset + trimmed.length;
      const newOrgOffset = marker.originalOffset + trimmed.length;
      const newLength = marker.value.length;

      marker.modifiedOffset = newModOffset;
      marker.originalOffset = newOrgOffset;
      marker.delta = isInsert
        ? new Delta([{ retain: newModOffset }, { insert: marker.value }])
        : new Delta([{ retain: newModOffset }, { delete: newLength }]);

      marker.stat = isInsert ? [newLength, 0] : [0, newLength];

      const id = nanoid();
      markers[id] = {
        id,
        modifiedOffset: oldModOffset,
        originalOffset: oldOrgOffset,
        operation: marker.operation,
        value: trimmed,
        length: trimmed.length,
        stat: isInsert ? [trimmed.length, 0] : [0, trimmed.length],
        delta: isInsert
          ? new Delta([{ retain: oldModOffset }, { insert: trimmed }])
          : new Delta([{ retain: oldModOffset }, { delete: trimmed.length }]),
      };
    }
  }
}

function trimEnd(
  markers: DiffMarkers,
  modifiedValue: string,
  eol: string,
  indentChar: string
) {
  for (const [, marker] of Object.entries(markers)) {
    if (!marker.value) {
      continue;
    }

    const isInsert = marker.operation === 'insert';
    const isDelete = marker.operation === 'delete';
    const intentAtEnd = `(\n)(${indentChar}+)$`;
    const matchEnd = marker.value.match(new RegExp(intentAtEnd));

    const lineOffset = indexInLineStart(
      modifiedValue,
      marker.modifiedOffset,
      eol
    );

    if (matchEnd && lineOffset === marker.modifiedOffset) {
      const trimmed = matchEnd[2];

      marker.value = marker.value.slice(0, -trimmed.length);
      marker.delta = isInsert
        ? new Delta([
            { retain: marker.modifiedOffset },
            { insert: marker.value },
          ])
        : new Delta([
            { retain: marker.modifiedOffset },
            { delete: marker.value.length },
          ]);
      marker.stat = isInsert
        ? [marker.value.length, 0]
        : [0, marker.value.length];

      const id = nanoid();
      markers[id] = {
        id,
        modifiedOffset: isDelete
          ? marker.modifiedOffset + marker.value.length
          : marker.modifiedOffset,
        originalOffset: isInsert
          ? marker.originalOffset + marker.value.length
          : marker.originalOffset,
        operation: marker.operation,
        value: trimmed,
        length: trimmed.length,
        stat: isInsert ? [trimmed.length, 0] : [0, trimmed.length],
        delta: isInsert
          ? new Delta([{ retain: marker.modifiedOffset }, { insert: trimmed }])
          : new Delta([
              { retain: marker.modifiedOffset + marker.value.length },
              { delete: trimmed.length },
            ]),
      };
    }
  }
}

function detectIndents(
  markers: DiffMarkers,
  modifiedValue: string,
  eol: string,
  indentChar: string
) {
  for (const [, marker] of Object.entries(markers)) {
    const pattern = `^${indentChar}+$`;
    const re = new RegExp(pattern, 'g');
    if (marker.value && marker.value.match(re)) {
      const lineOffset = indexInLineStart(
        modifiedValue,
        marker.modifiedOffset,
        eol
      );
      const [firstNonIndentOffset] = firstNextDiferentChar(
        modifiedValue,
        lineOffset,
        indentChar
      );

      if (
        lineOffset === marker.modifiedOffset ||
        modifiedValue.slice(lineOffset, firstNonIndentOffset).match(re)
      ) {
        markers[marker.id] = {
          ...marker,
          type: 'indent',
        };

        if (lineOffset !== marker.modifiedOffset) {
          markers[marker.id] = {
            ...markers[marker.id],
            modifiedOffset: lineOffset,
            delta:
              marker.operation === 'insert'
                ? new Delta([{ retain: lineOffset }, { insert: marker.value }])
                : new Delta([
                    { retain: lineOffset },
                    { delete: marker.value.length },
                  ]),
          };
        }
      }
    }
  }
}

function firstNextDiferentChar(
  value: string,
  startOffset: number,
  stopChar: string
): [number, string | undefined] {
  let checkIndex = startOffset;
  while (value.at(checkIndex) === stopChar) {
    checkIndex++;
  }
  return [checkIndex, value.at(checkIndex)];
}

function indexInLineStart(value: string, offset: number, eol: string) {
  let checkIndex = offset - 1;
  while (checkIndex >= 0) {
    if (value.at(checkIndex) === eol) {
      break;
    }
    checkIndex--;
  }
  return checkIndex + 1;
}

function mergeIndentsInSameLine(
  markers: DiffMarkers,
  modifiedValue: string,
  eol: string,
  indentChar: string
) {
  const markersPerLine: Record<number, DiffMarker> = {};

  for (const [, marker] of Object.entries(markers)) {
    if (
      !isIndentMarker(marker) ||
      !marker.value?.match(new RegExp(`^${indentChar}+$`))
    ) {
      continue;
    }

    const lineNum = getLineNum(marker.modifiedOffset, modifiedValue, eol);

    if (!markersPerLine[lineNum]) {
      markersPerLine[lineNum] = marker;
    } else {
      const first =
        marker.value.length * (marker.operation === 'delete' ? -1 : 1);
      const second =
        markersPerLine[lineNum].value!.length *
        (markersPerLine[lineNum].operation === 'delete' ? -1 : 1);

      const total = first + second;

      const id = nanoid();

      if (total > 0) {
        markers[id] = {
          id,
          type: 'indent',
          operation: 'insert',
          delta: new Delta([
            { retain: marker.modifiedOffset },
            { insert: indentChar.repeat(total) },
          ]),
          value: indentChar.repeat(total),
          length: total,
          modifiedOffset: marker.modifiedOffset,
          originalOffset: marker.originalOffset,
          stat: [total, 0],
        };
      } else if (total < 0) {
        const length = -total;
        markers[id] = {
          id,
          type: 'indent',
          operation: 'delete',
          delta: new Delta([
            { retain: marker.modifiedOffset },
            { delete: length },
          ]),
          value: indentChar.repeat(length),
          length: length,
          modifiedOffset: marker.modifiedOffset,
          originalOffset: marker.originalOffset,
          stat: [0, length],
        };
      }

      delete markers[marker.id];
      delete markers[markersPerLine[lineNum].id];

      markersPerLine[lineNum] = markers[id];
    }
  }
}

function mergeConsecutiveIndents(
  markers: DiffMarkers,
  modifiedValue: string,
  eol: string,
  indentChar: string
) {
  const markersArr = Object.values(markers).sort(
    (a, b) => a.originalOffset - b.originalOffset
  );

  let lastMarker:
    | {
        line: number;
        marker: DiffMarker;
      }
    | undefined;

  for (const marker of markersArr) {
    if (
      !isIndentMarker(marker) ||
      !marker.value?.match(new RegExp(`^${indentChar}+$`))
    ) {
      continue;
    }

    const lineNum = getLineNum(marker.modifiedOffset, modifiedValue, eol);

    if (
      lastMarker?.line === lineNum - 1 &&
      lastMarker.marker.operation === marker.operation
    ) {
      const id = nanoid();
      const length = lastMarker.marker.length + marker.length;
      markers[id] = {
        id,
        type: 'indent',
        operation: marker.operation,
        delta: lastMarker.marker.delta.compose(marker.delta),
        value: undefined,
        length,
        modifiedOffset: marker.modifiedOffset,
        originalOffset: marker.originalOffset,
        stat: marker.operation === 'insert' ? [length, 0] : [0, length],
      };

      delete markers[lastMarker.marker.id];
      delete markers[marker.id];

      lastMarker = {
        line: lineNum,
        marker: markers[id],
      };
    } else {
      lastMarker = {
        line: lineNum,
        marker,
      };
    }
    // getLineContent
  }
}
// function mergeIndents(
//   markers: DiffMarkers,
//   modifiedValue: string,
//   originalValue: string,
//   tab: string,
//   eol: string
// ) {
//   const markersArr = Object.values(markers).sort(
//     (a, b) => a.originalOffset - b.originalOffset
//   );
//   const toDelete: string[] = [];

//   let refI = 0;
//   for (const refMarker of markersArr) {
//     if (toDelete.includes(refMarker.id)) {
//       delete markers[refMarker.id];
//     } else if (isIndentMarker(refMarker) && refMarker.operation === 'insert') {
//       const toMerge: IndentDiffMarker[] = [];
//       const refMarkerOrigLine = getLineNum(
//         refMarker.originalOffset,
//         originalValue,
//         eol
//       );

//       for (let nextI = refI + 1; nextI < markersArr.length; nextI++) {
//         // check if currLine = nextLine + 1 for another 'add-indent'
//         // and then currLine = nextLine + 2 for next one etc
//         const nextMarker = markersArr[nextI];
//         const nextOrigLineNum = getLineNum(
//           nextMarker.originalOffset,
//           originalValue,
//           eol
//         );

//         if (
//           isIndentMarker(nextMarker) &&
//           nextMarker.operation === 'insert' &&
//           nextOrigLineNum === refMarkerOrigLine + (nextI - refI)
//         ) {
//           // add-indent found in next line
//           toMerge.push(nextMarker);
//         }
//       }

//       if (toMerge.length) {
//         // create new Delta() which inserts tab(s)
//         const refModLine = getLineNum(
//           refMarker.modifiedOffset,
//           modifiedValue,
//           eol
//         );
//         const offset = getLineOffset(refModLine, modifiedValue, eol);

//         let resDelta = new Delta()
//           .retain(offset)
//           .insert(tab.repeat(refMarker.indentVal));

//         for (const marker of toMerge) {
//           const modLineNum = getLineNum(
//             marker.modifiedOffset,
//             modifiedValue,
//             eol
//           );
//           const offset = getLineOffset(modLineNum, modifiedValue, eol);

//           resDelta = resDelta.compose(
//             new Delta().retain(offset).insert(tab.repeat(marker.indentVal))
//           );
//           toDelete.push(marker.id);
//         }

//         markers[refMarker.id].delta = resDelta;
//       }
//     }
//     refI++;
//   }
// }

// function separateTabsAndNewLines(
//   markers: DiffMarkers,
//   tab: string,
//   eol: string
// ) {
//   const markersArr = Object.values(markers).sort(
//     (a, b) => a.originalOffset - b.originalOffset
//   );
//   const pattern = `${eol}[${tab}]+$`;
//   const re = new RegExp(pattern, 'g');

//   let i = 0;
//   for (const marker of markersArr) {
//     const nextMarker = markersArr[i + 1];
//     const oldVal = deltaToString([marker.delta]);
//     let matched = oldVal.match(re);

//     if (
//       isIndentMarker(nextMarker) &&
//       marker.operation === 'insert' &&
//       matched
//     ) {
//       const tabs = matched[0].slice(1, matched[0].length); // removing matched /n at the beginning
//       const newInsertVal = oldVal.slice(0, oldVal.length - tabs.length); // removing tab(s) at the end

//       marker.delta = new Delta([
//         { retain: marker.modifiedOffset },
//         { insert: newInsertVal },
//       ]);

//       const newId = nanoid();
//       markers[newId] = {
//         id: newId,
//         length: marker.length,
//         modifiedOffset: marker.modifiedOffset,
//         originalOffset: marker.originalOffset + newInsertVal.length,
//         operation: 'insert',
//         delta: new Delta([{ retain: marker.modifiedOffset }, { insert: tabs }]),
//         stat: [tabs.length, 0],
//         type: 'indent',
//         indentVal: tabs.split(tab).length - 1,
//       };
//     }
//     i++;
//   }
// }

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

          const code = isIndentMarker(marker)
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

function getLineContent(value: string, line: number, eol: string): string {
  return value.split(eol)[line];
}
// function getLineOffset(
//   line: number,
//   modifiedValue: string,
//   eol: string
// ): number {
//   const splitted = modifiedValue.split(eol);
//   if (line <= 1) {
//     return 0;
//   }
//   if (line > splitted.length) {
//     return modifiedValue.length;
//   }
//   splitted.splice(line - 1);
//   return splitted.join(eol).length + 1;
// }
