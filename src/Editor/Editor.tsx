import React, { useEffect, useRef } from "react";
import { useStore } from "../store";
import type * as monaco from "monaco-editor";
import { diffs as fixtures } from "../__tests__/fixtures/diffs";
import { createCommands, diff, executeCommands } from "../edits";
import { monacoHelpers } from "../utils/monaco";

export function Editor() {
  const editorDiv = useRef<HTMLDivElement>(null);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const activeChanges = useStore((state) => state.activeChanges);
  const changes = useStore((state) => state.changes);

  useEffect(() => {
    if (editorDiv.current) {
      editor.current = window.monaco.editor.create(editorDiv.current, {
        value: fixtures[0].oldVal,
        language: "javascript",
      });
    }
  }, [editorDiv]);

  useEffect(() => {
    if (editor.current) {
      const commands = activeChanges.map((change) => changes[change].command);
      const res = executeCommands(commands, fixtures[0].oldVal);

      const currentValue = editor.current.getValue();
      const newValue = res.toString();

      const newCommads = createCommands(diff(currentValue, newValue));

      // todo
      // calcuate diffs for monaco to avoid setValue
      const monacoModel = editor.current.getModel();
      if (monacoModel) {
        const { getRange } = monacoHelpers(monacoModel);
        const edits = newCommads.map((command) =>
          command.type === "insert"
            ? {
                range: getRange(command.index, command.index),
                text: command.value,
              }
            : command.type === "delete"
            ? {
                range: getRange(
                  command.index,
                  command.index + command.delLength
                ),
                text: "",
              }
            : {
                // replace
                range: getRange(
                  command.index,
                  command.index + command.oldValue.length
                ),
                text: command.value,
              }
        );

        monacoModel.applyEdits(edits);
      }
      if (editor.current.getValue() !== newValue) {
        // should not occur, but just in case
        editor.current.setValue(newValue);
      }
    }
  }, [activeChanges, changes]);

  return (
    <div
      ref={editorDiv}
      id="editor"
      style={{
        width: 800,
        height: 400,
      }}
    ></div>
  );
}
