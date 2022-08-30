import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';

import { Change } from '../atoms/changes';

export const blankModel = monaco.editor.createModel('', 'typescript');
export const modifiedModel = monaco.editor.createModel('', 'typescript');
export const previewModel = monaco.editor.createModel('', 'typescript');
export const originalModel = monaco.editor.createModel('', 'typescript');
monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: true,
});

export function getMonacoEdits(
  delta: Delta,
  monacoModel: monaco.editor.ITextModel
): monaco.editor.IIdentifiedSingleEditOperation[] {
  const edits: (monaco.editor.IIdentifiedSingleEditOperation & {
    rangeOffset: number;
  })[] = [];

  let index = 0;
  for (const op of delta.ops) {
    if (op.retain !== undefined) {
      index += op.retain;
    } else if (typeof op.insert === 'string') {
      const posStart = monacoModel.getPositionAt(index);

      edits.push({
        range: new monaco.Range(
          posStart.lineNumber,
          posStart.column,
          posStart.lineNumber,
          posStart.column
        ),
        text: op.insert,
        rangeOffset: index,
      });

      index += op.insert.length;
    } else if (op.delete !== undefined) {
      const posStart = monacoModel.getPositionAt(index);
      const posEnd = monacoModel.getPositionAt(index + op.delete);

      edits.push({
        range: new monaco.Range(
          posStart.lineNumber,
          posStart.column,
          posEnd.lineNumber,
          posEnd.column
        ),
        text: '',
        rangeOffset: index,
      });
    }
  }

  return edits
    .sort((c1, c2) => c2.rangeOffset - c1.rangeOffset)
    .map((c) => ({
      range: c.range,
      text: c.text,
    }));
}

export function removeDeletions(delta: Delta) {
  let resDelta = new Delta();

  for (const op of delta.ops) {
    if (op.retain) {
      resDelta = resDelta.retain(op.retain);
    }
    if (op.insert) {
      resDelta = resDelta.insert(op.insert);
    }
  }

  return resDelta;
}

export function removeInserts(delta: Delta) {
  let resDelta = new Delta();

  for (const op of delta.ops) {
    if (op.retain) {
      resDelta = resDelta.retain(op.retain);
    }

    if (op.delete) {
      resDelta = resDelta.delete(op.delete);
    }
  }

  return resDelta;
}

export function getHighlightsAfter(delta: Delta, eolChar: string) {
  const highlights: Change['highlight'] = [];

  let index = 0;
  for (let i = 0; i < delta.ops.length; i++) {
    const op = delta.ops[i];
    if (op.retain !== undefined) {
      index += op.retain;
    } else if (typeof op.insert === 'string') {
      const nextOp = delta.ops[i + 1];
      if (nextOp?.delete) {
        highlights.push({
          offset: index,
          length: op.insert.length,
          type: 'replace',
          options: {
            className: 'replace-highlight',
          },
        });

        const newLineOffset = op.insert.endsWith(eolChar) ? -eolChar.length : 0;
        highlights.push({
          offset: index + op.insert.length + newLineOffset,
          length: 0,
          type: 'replace',
          options: {
            className: 'highlight-cursor cursor-color-replace',
          },
        });

        index += op.insert.length;
        i++; // skip next delta since it's covered here
      } else {
        highlights.push({
          offset: index,
          length: op.insert.length,
          type: 'insert',
          options: {
            className: 'insert-highlight',
          },
        });

        const newLineOffset = op.insert.endsWith(eolChar) ? -eolChar.length : 0;
        highlights.push({
          offset: index + op.insert.length + newLineOffset,
          length: 0,
          type: 'insert',
          options: {
            className: 'highlight-cursor',
          },
        });

        index += op.insert.length;
      }
    } else if (op.delete !== undefined) {
      highlights.push({
        offset: index,
        length: 0,
        type: 'delete',
        options: {
          className: 'highlight-cursor cursor-color-delete',
        },
      });
    }
  }

  return highlights;
}

export function getRange(
  monacoModel: monaco.editor.ITextModel,
  startOffset: number,
  length: number
) {
  const startPos = monacoModel.getPositionAt(startOffset);
  const endPos = monacoModel.getPositionAt(startOffset + length);
  return new monaco.Range(
    startPos.lineNumber,
    startPos.column,
    endPos.lineNumber,
    endPos.column
  );
}
