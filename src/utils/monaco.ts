import type * as monaco from "monaco-editor";

export const monacoHelpers = (monacoModel: monaco.editor.ITextModel) => ({
  getRange(startIndex: number, endIndex: number) {
    const pos = monacoModel.getPositionAt(startIndex);
    const endPos = monacoModel.getPositionAt(endIndex);

    return new window.monaco.Selection(
      pos.lineNumber,
      pos.column,
      endPos.lineNumber,
      endPos.column
    );
  },
});
