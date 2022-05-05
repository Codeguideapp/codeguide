import { DIFF_INSERT, diff_match_patch } from 'diff-match-patch';

export function diffChars(oldStr: string, newStr: string) {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(oldStr, newStr);
  dmp.diff_cleanupSemantic(diffs);
  return diffs;
}

export function mergeTabsInSequence(diffs: [number, string][], tab: string) {
  const deleteIndexes: number[] = [];

  let i = diffs.length - 1;
  while (i >= 0) {
    const currentDiff = diffs[i];
    let numOfPrevMerged = 0;

    if (currentDiff[0] === DIFF_INSERT && isIndent(currentDiff[1], tab)) {
      for (let j = i - 1; j >= 0; j--) {
        const prevDiff = diffs[j];

        if (prevDiff[0] === DIFF_INSERT && isIndent(prevDiff[1], tab)) {
          deleteIndexes.push(j);
          diffs[i][1] = currentDiff[1] + prevDiff[1];
          numOfPrevMerged++;
        } else {
          break;
        }
      }
    }

    i = i - 1 - numOfPrevMerged;
  }

  for (const index of deleteIndexes) {
    diffs.splice(index, 1);
  }
}

function isIndent(value: string, tab: string) {
  const pattern = `^[${tab}]+$`;
  const re = new RegExp(pattern, 'g');
  return re.test(value);
}
