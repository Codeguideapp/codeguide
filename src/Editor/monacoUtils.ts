import * as monaco from 'monaco-editor';

import { Command, undoCommand } from '../edits';

export function applyCommand(
  command: Command,
  editor: monaco.editor.IStandaloneCodeEditor
) {
  const monacoModel = editor.getModel()!;

  const insert = (index: number, text: string) => {
    const pos = monacoModel.getPositionAt(index);

    monacoModel.applyEdits([
      {
        range: new monaco.Range(
          pos.lineNumber,
          pos.column,
          pos.lineNumber,
          pos.column
        ),
        text,
      },
    ]);
  };

  const del = (index: number, text: string) => {
    const pos = monacoModel.getPositionAt(index);
    const posOldValEnd = monacoModel.getPositionAt(index + text.length);

    monacoModel.applyEdits([
      {
        range: new monaco.Range(
          pos.lineNumber,
          pos.column,
          posOldValEnd.lineNumber,
          posOldValEnd.column
        ),
        text: '',
      },
    ]);
  };

  switch (command.type) {
    case 'insert':
      insert(command.index, command.value);
      break;
    case 'delete':
      del(command.index, command.value);
      break;
    case 'replace':
      del(command.index, command.oldValue);
      insert(command.index, command.value);
      break;
  }
}

export function highlightCommand(
  command: Command,
  editor: monaco.editor.IStandaloneCodeEditor,
  decorations: React.MutableRefObject<string[]>
) {
  const monacoModel = editor.getModel()!;

  switch (command.type) {
    case 'insert': {
      const pos = monacoModel.getPositionAt(command.index);
      monacoModel.applyEdits([
        {
          range: new monaco.Range(
            pos.lineNumber,
            pos.column,
            pos.lineNumber,
            pos.column
          ),
          text: command.value,
        },
      ]);

      const posOldValEnd = monacoModel.getPositionAt(
        command.index + command.value.length
      );

      const range = new monaco.Range(
        pos.lineNumber,
        pos.column,
        posOldValEnd.lineNumber,
        posOldValEnd.column
      );

      decorations.current = editor.deltaDecorations(decorations.current, [
        {
          range,
          options: {
            className: 'insert-suggestion',
          },
        },
      ]);

      editor.revealRange(range);

      return undoCommand(command);
    }
    case 'delete': {
      const pos = monacoModel.getPositionAt(command.index);
      const posOldValEnd = monacoModel.getPositionAt(
        command.index + command.value.length
      );

      const range = new monaco.Range(
        pos.lineNumber,
        pos.column,
        posOldValEnd.lineNumber,
        posOldValEnd.column
      );

      decorations.current = editor.deltaDecorations(decorations.current, [
        {
          range,
          options: {
            inlineClassName: 'delete-suggestion',
            inlineClassNameAffectsLetterSpacing: true,
          },
        },
      ]);

      editor.revealRange(range);

      return {
        type: 'insert',
        index: 0,
        value: '',
      } as Command;
    }
    case 'replace': {
      const oldValStartPos = monacoModel.getPositionAt(command.index);
      const oldValEndPos = monacoModel.getPositionAt(
        command.index + command.oldValue.length
      );

      monacoModel.applyEdits([
        {
          range: new monaco.Range(
            oldValEndPos.lineNumber,
            oldValEndPos.column,
            oldValEndPos.lineNumber,
            oldValEndPos.column
          ),
          text: command.value,
        },
      ]);

      const newValEndPos = monacoModel.getPositionAt(
        command.index + command.oldValue.length + command.value.length
      );

      decorations.current = editor.deltaDecorations(decorations.current, [
        {
          range: new monaco.Range(
            oldValStartPos.lineNumber,
            oldValStartPos.column,
            oldValEndPos.lineNumber,
            oldValEndPos.column
          ),
          options: {
            inlineClassName: 'delete-suggestion',
            inlineClassNameAffectsLetterSpacing: true,
          },
        },
        {
          range: new monaco.Range(
            oldValEndPos.lineNumber,
            oldValEndPos.column,
            newValEndPos.lineNumber,
            newValEndPos.column
          ),
          options: {
            className: 'insert-suggestion',
          },
        },
      ]);

      editor.revealRange(
        new monaco.Range(
          oldValEndPos.lineNumber,
          oldValEndPos.column,
          newValEndPos.lineNumber,
          newValEndPos.column
        )
      );

      return undoCommand({
        type: 'insert',
        index: command.index + command.oldValue.length,
        value: command.value,
      });
    }
  }
}
