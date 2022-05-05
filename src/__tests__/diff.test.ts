import { getDiffMarkers, isIndentMarker } from '../api/diffMarkers';
import { mergeTabsInSequence } from '../api/diffMatchPatch';

describe('diff', () => {
  it('should merge tabs in sequence', () => {
    const diffs: [number, string][] = [
      [0, '-\n'],
      [1, '{examplesSelect || (\n'],
      [1, '\t\t'],
      [0, '\t<Text color="body" role="heading">\n\t\t'],
      [1, '\t'],
      [1, '\t'],
      [0, 'Example\n\t\t'],
      [1, '\t'],
      [1, '\t'],
      [0, 'Second\n'],
      [1, '\t\t'],
      [0, '\t</Text>\n'],
      [1, ')}\n'],
    ];
    mergeTabsInSequence(diffs, '\t');

    expect(diffs).toEqual([
      [0, '-\n'],
      [1, '{examplesSelect || (\n'],
      [1, '\t\t'],
      [0, '\t<Text color="body" role="heading">\n\t\t'],
      [1, '\t\t'],
      [0, 'Example\n\t\t'],
      [1, '\t\t'],
      [0, 'Second\n'],
      [1, '\t\t'],
      [0, '\t</Text>\n'],
      [1, ')}\n'],
    ]);
  });

  it('should detect indents', () => {
    const tabIndent = {
      oldVal: `
\t<Text color="body" role="heading">
\t\tExample
\t\tSecond
\t</Text>`,
      newVal: `
\t\t<Text color="body" role="heading">
\t\t\tExample
\t\t\tSecond
\t\t</Text>`,
    };

    const diffMarkers = getDiffMarkers(
      tabIndent.oldVal,
      tabIndent.newVal,
      '\t'
    );
    expect(Object.values(diffMarkers).filter(isIndentMarker).length === 4);

    const tabIndentDouble = {
      oldVal: `
\t<Text color="body" role="heading">
\t\tExample
\t\tSecond
\t</Text>`,
      newVal: `
\t\t\t<Text color="body" role="heading">
\t\t\t\tExample
\t\t\t\tSecond
\t\t\t</Text>`,
    };

    const diffMarkers2 = getDiffMarkers(
      tabIndentDouble.oldVal,
      tabIndentDouble.newVal,
      '\t'
    );
    expect(Object.values(diffMarkers2).filter(isIndentMarker).length === 4);
  });
});
