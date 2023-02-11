import Delta from 'quill-delta';

export type StepPreview = Record<
  number,
  {
    isDelete?: boolean;
    isHighlight?: boolean;
    code: string;
  }[]
>;

export function getStepPreview({
  delta,
  before,
  after,
  selections,
}: {
  delta: Delta;
  before: string;
  after: string;
  selections: { length: number; offset: number }[];
}): StepPreview {
  const eol = '\n';
  const preview: StepPreview = {};

  let index = 0;
  for (const op of delta.ops) {
    if (op.retain !== undefined) {
      index += op.retain;
    } else {
      let value =
        typeof op.insert === 'string'
          ? op.insert
          : op.delete !== undefined
          ? before.slice(index, index + op.delete)
          : '';

      const startLineNum = getLineNum(index, before, eol);
      const endLineNum = startLineNum + value.split(eol).length - 1;
      const valueSplitted = value.split(eol);

      for (let lineNum = startLineNum; lineNum <= endLineNum; lineNum++) {
        let lineContent = valueSplitted[lineNum - startLineNum];
        if (!lineContent) {
          lineContent = '\\n';
        }

        if (value.match(/^ +$/)) {
          value = '[whitespace]';
        }

        const code = lineContent;

        if (!preview[lineNum]) {
          preview[lineNum] = [];
        }
        preview[lineNum].push({ isDelete: op.delete !== undefined, code });
      }
    }
  }

  if (selections.length) {
    appendHighlightPreview(preview, selections, after);
  }

  const previewLines = Object.keys(preview);
  if (previewLines.length > 3) {
    const toRemove = previewLines.splice(2, previewLines.length - 3);
    for (const line of toRemove) {
      delete preview[Number(line)];
    }
  }
  return preview;
}

function appendHighlightPreview(
  preview: StepPreview,
  highlights: { length: number; offset: number }[],
  fileVal: string
): StepPreview {
  const eol = '\n';

  for (const highlight of highlights) {
    let value = fileVal.slice(
      highlight.offset,
      highlight.offset + highlight.length
    );

    const startLineNum = getLineNum(highlight.offset, fileVal, eol);
    const endLineNum = startLineNum + value.split(eol).length - 1;
    const valueSplitted = value.split(eol);

    for (let lineNum = startLineNum; lineNum <= endLineNum; lineNum++) {
      let lineContent = valueSplitted[lineNum - startLineNum];
      if (!lineContent) {
        lineContent = '\\n';
      }

      if (value.match(/^ +$/)) {
        value = '[whitespace]';
      }

      const code = lineContent;

      if (!preview[lineNum]) {
        preview[lineNum] = [];
      }
      preview[lineNum].push({ code, isHighlight: true });
    }
  }

  return preview;
}

function getLineNum(index: number, modifiedValue: string, eol: string): number {
  return modifiedValue.slice(0, index).split(eol).length;
}
