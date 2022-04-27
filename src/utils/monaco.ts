import * as monaco from 'monaco-editor';

export const modifiedModel = monaco.editor.createModel('', 'typescript');
export const previewModel = monaco.editor.createModel('', 'typescript');
export const originalModel = monaco.editor.createModel('', 'typescript');
monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: true,
});

export const diffGutterMouseHandler =
  (diffEditor: React.MutableRefObject<monaco.editor.IDiffEditor | undefined>) =>
  (e: monaco.editor.IEditorMouseEvent) => {
    const lineNumber = e.target.position?.lineNumber;
    if (
      !diffEditor.current ||
      lineNumber === undefined ||
      e.target.type !== monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN
    ) {
      return;
    }

    const diff = diffEditor.current
      .getLineChanges()
      ?.find(
        (l) =>
          l.modifiedStartLineNumber <= lineNumber &&
          lineNumber <= l.modifiedEndLineNumber
      );

    if (!diff) return;

    const valueInRange = originalModel.getValueInRange(
      new monaco.Range(
        diff.modifiedStartLineNumber,
        1,
        diff.modifiedEndLineNumber,
        originalModel.getLineMaxColumn(diff.modifiedEndLineNumber)
      )
    );

    if (diff.originalEndLineNumber === 0) {
      const column = modifiedModel.getLineMaxColumn(
        diff.originalStartLineNumber
      );
      diffEditor.current.getOriginalEditor().executeEdits('diffEditor', [
        {
          range: new monaco.Range(
            diff.originalStartLineNumber,
            column,
            diff.originalStartLineNumber,
            column
          ),
          text: originalModel.getEOL() + valueInRange,
        },
      ]);
    } else {
      const column = modifiedModel.getLineMaxColumn(diff.originalEndLineNumber);

      diffEditor.current.getOriginalEditor().executeEdits('diffEditor', [
        {
          range: new monaco.Range(
            diff.originalStartLineNumber,
            1,
            diff.originalEndLineNumber,
            column
          ),
          text: valueInRange,
        },
      ]);
    }
  };
