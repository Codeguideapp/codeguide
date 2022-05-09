import { DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT } from 'diff-match-patch';
import lineColumn from 'line-column';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { diffChars } from './diffMatchPatch';
import { mergeTabsInSequence } from './diffMatchPatch';

interface BaseDiffMarker {
  id: string;
  modifiedOffset: number;
  originalOffset: number;
  operation: 'replace' | 'insert' | 'delete';
  newValue: string;
  oldValue: string;
  delta: Delta;
}

interface IndentDiffMarker extends BaseDiffMarker {
  type: 'indent';
  indentVal: number;
}

export type DiffMarker = BaseDiffMarker | IndentDiffMarker;
export type DiffMarkers = Record<string, DiffMarker>;

export const isIndentMarker = (m: DiffMarker): m is IndentDiffMarker => {
  return typeof m === 'object' && 'type' in m && m.type === 'indent';
};

export function getDiffMarkers(
  modifiedValue: string,
  originalValue: string,
  tab: string
): DiffMarkers {
  const diffs = diffChars(modifiedValue, originalValue);
  mergeTabsInSequence(diffs, tab);

  const markers: DiffMarkers = {};
  let modifiedOffset = 0;
  let originalOffset = 0;
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
          newValue: '',
          oldValue: value,
          delta: new Delta([
            { retain: modifiedOffset },
            { delete: value.length },
          ]),
        };

        if (isIndent(value, tab)) {
          markers[id] = {
            ...markers[id],
            type: 'indent',
            indentVal: value.split(tab).length - 1,
          };
        }
        modifiedOffset += value.length;
      }
    } else if (type === DIFF_INSERT) {
      const id = nanoid();

      if (prev?.[0] === DIFF_DELETE) {
        markers[id] = {
          id,
          modifiedOffset,
          originalOffset,
          operation: 'replace',
          newValue: value,
          oldValue: prev[1],
          delta: new Delta([
            { retain: modifiedOffset },
            { delete: prev[1].length },
            { insert: value },
          ]),
        };
        modifiedOffset += prev[1].length;
        originalOffset += value.length;
      } else {
        markers[id] = {
          id,
          modifiedOffset,
          originalOffset,
          operation: 'insert',
          delta: new Delta([{ retain: modifiedOffset }, { insert: value }]),
          newValue: value,
          oldValue: '',
        };
        if (isIndent(value, tab)) {
          markers[id] = {
            ...markers[id],
            type: 'indent',
            indentVal: value.split(tab).length - 1,
          };
        }
        originalOffset += value.length;
      }
    }
    i++;
  }

  separateTabsAndNewLines(markers, tab);
  mergeIndents(markers, modifiedValue, originalValue, tab);
  return markers;
}

function mergeIndents(
  markers: DiffMarkers,
  modifiedValue: string,
  originalValue: string,
  tab: string
) {
  const lcOriginal = lineColumn(originalValue);
  const lcModified = lineColumn(modifiedValue);

  const markersArr = Object.values(markers).sort(
    (a, b) => a.originalOffset - b.originalOffset
  );
  const toDelete: string[] = [];

  let refI = 0;
  for (const refMarker of markersArr) {
    if (toDelete.includes(refMarker.id)) {
      delete markers[refMarker.id];
    } else if (isIndentMarker(refMarker) && refMarker.operation === 'insert') {
      const toMerge: IndentDiffMarker[] = [];
      const refMarkerOrigLine = lcOriginal.fromIndex(
        refMarker.originalOffset
      )!.line;

      for (let nextI = refI + 1; nextI < markersArr.length; nextI++) {
        // check if currLine = nextLine + 1 for another 'add-indent'
        // and then currLine = nextLine + 2 for next one etc
        const nextMarker = markersArr[nextI];
        const nextOrigLineNum = lcOriginal.fromIndex(
          nextMarker.originalOffset
        )!.line;

        if (
          isIndentMarker(nextMarker) &&
          nextMarker.operation === 'insert' &&
          nextOrigLineNum === refMarkerOrigLine + (nextI - refI)
        ) {
          // add-indent found in next line
          toMerge.push(nextMarker);
        }
      }

      if (toMerge.length) {
        // create new Delta() which inserts tab(s)
        const refModLine = lcModified.fromIndex(refMarker.modifiedOffset)!.line;
        const offset = lcModified.toIndex(refModLine, 1);
        let resDelta = new Delta()
          .retain(offset)
          .insert(tab.repeat(refMarker.indentVal));

        for (const marker of toMerge) {
          const modLineNum = lcModified.fromIndex(marker.modifiedOffset)!.line;

          const offset = lcModified.toIndex(modLineNum, 1);
          resDelta = resDelta.compose(
            new Delta().retain(offset).insert(tab.repeat(marker.indentVal))
          );
          toDelete.push(marker.id);
        }

        markers[refMarker.id].delta = resDelta;
      }
    }
    refI++;
  }
}

function separateTabsAndNewLines(markers: DiffMarkers, tab: string) {
  const markersArr = Object.values(markers).sort(
    (a, b) => a.originalOffset - b.originalOffset
  );
  const pattern = `\n[${tab}]+$`;
  const re = new RegExp(pattern, 'g');

  let i = 0;
  for (const marker of markersArr) {
    const nextMarker = markersArr[i + 1];
    const oldVal = marker.newValue;
    let matched = oldVal.match(re);

    if (
      isIndentMarker(nextMarker) &&
      marker.operation === 'insert' &&
      matched
    ) {
      const tabs = matched[0].slice(1, matched[0].length); // removing matched /n at the beginning
      const newInsertVal = oldVal.slice(0, oldVal.length - tabs.length); // removing tab(s) at the end

      marker.newValue = newInsertVal;
      marker.delta = new Delta([
        { retain: marker.modifiedOffset },
        { insert: newInsertVal },
      ]);

      const newId = nanoid();
      markers[newId] = {
        id: newId,
        modifiedOffset: marker.modifiedOffset,
        originalOffset: marker.originalOffset + newInsertVal.length,
        operation: 'insert',
        delta: new Delta([{ retain: marker.modifiedOffset }, { insert: tabs }]),
        newValue: tabs,
        oldValue: '',
        type: 'indent',
        indentVal: tabs.split(tab).length - 1,
      };
    }
    i++;
  }
}

function isIndent(value: string, tab: string) {
  const pattern = `^[${tab}]+$`;
  const re = new RegExp(pattern, 'g');
  return re.test(value);
}
