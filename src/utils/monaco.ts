import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';

import { Change } from '../atoms/types';

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
) {
  const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];

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
      });
    }
  }

  return edits;
}

export function applyDelta(
  delta: Delta,
  monacoModel: monaco.editor.ITextModel
) {
  let cursorOffset = 0;
  let index = 0;
  for (const op of delta.ops) {
    if (op.retain !== undefined) {
      index += op.retain;
    } else if (typeof op.insert === 'string') {
      const posStart = monacoModel.getPositionAt(index);

      monacoModel.applyEdits([
        {
          range: new monaco.Range(
            posStart.lineNumber,
            posStart.column,
            posStart.lineNumber,
            posStart.column
          ),
          text: op.insert,
        },
      ]);

      index += op.insert.length;
      cursorOffset = index + op.insert.length;
    } else if (op.delete !== undefined) {
      const posStart = monacoModel.getPositionAt(index);
      const posEnd = monacoModel.getPositionAt(index + op.delete);

      monacoModel.applyEdits([
        {
          range: new monaco.Range(
            posStart.lineNumber,
            posStart.column,
            posEnd.lineNumber,
            posEnd.column
          ),
          text: '',
        },
      ]);

      cursorOffset = index + op.delete;
    }
  }
  return cursorOffset;
}

export function getHighlightsBefore(delta: Delta, eolChar: string) {
  const highlights: Change['highlight'] = [];

  let index = 0;
  let i = 0;

  // todo: refactor by iterating delta.ops and check nextOp for "replace" (not highlights arr like now)

  for (const op of delta.ops) {
    if (op.retain !== undefined) {
      index += op.retain;
    } else if (typeof op.insert === 'string') {
      highlights.push({
        offset: op.insert.startsWith(eolChar) ? index + eolChar.length : index,
        length: 0,
        type: 'insert',
        options: {
          className: 'highlight-cursor',
        },
      });
      i++;
    } else if (op.delete !== undefined) {
      if (highlights[i - 1]?.type === 'insert') {
        highlights[i - 1].offset += op.delete;
        highlights[i - 1].options = {
          className: 'highlight-cursor cursor-color-replace',
        };

        highlights.push({
          offset: index,
          length: op.delete,
          type: 'replace',
          options: {
            className: 'replace-highlight',
          },
        });
        i++;
      } else {
        highlights.push({
          offset: index,
          length: op.delete,
          type: 'delete',
          options: {
            className: 'delete-highlight',
          },
        });
        i++;

        highlights.push({
          offset: index + op.delete,
          length: 0,
          type: 'insert',
          options: {
            className: 'highlight-cursor cursor-color-delete',
          },
        });
        i++;
      }
    }
  }

  return highlights;
}
export function getHighlightsAfter(delta: Delta, eolChar: string) {
  const highlights: Change['highlight'] = [];

  let index = 0;
  let i = 0;
  for (const op of delta.ops) {
    if (op.retain !== undefined) {
      index += op.retain;
    } else if (typeof op.insert === 'string') {
      highlights.push({
        offset: index,
        length: op.insert.length,
        type: 'insert',
        options: {
          className: 'insert-highlight',
        },
      });
      i++;

      const newLineOffset = op.insert.endsWith(eolChar) ? -eolChar.length : 0;
      highlights.push({
        offset: index + op.insert.length + newLineOffset,
        length: 0,
        type: 'insert',
        options: {
          className: 'highlight-cursor',
        },
      });
      i++;

      index += op.insert.length;
    } else if (op.delete !== undefined) {
      if (highlights[i - 1]?.type === 'insert') {
        highlights[i - 2].type = 'replace';
        highlights[i - 2].options = {
          className: 'replace-highlight',
        };

        highlights[i - 1].type = 'replace';
        highlights[i - 1].options = {
          className: 'highlight-cursor cursor-color-replace',
        };
      } else {
        highlights.push({
          offset: index,
          length: 0,
          type: 'insert',
          options: {
            className: 'highlight-cursor cursor-color-delete',
          },
        });
        i++;
      }
    }
  }

  return highlights;
}

export function getTabChar(monacoModel: monaco.editor.ITextModel) {
  monacoModel.detectIndentation(true, 2);
  const { insertSpaces, indentSize } = monacoModel.getOptions();
  return insertSpaces ? ' '.repeat(indentSize) : '\t';
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
