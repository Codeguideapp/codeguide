import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';

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
