import { useAtomValue } from 'jotai';
import * as monaco from 'monaco-editor';
import { useEffect, useRef } from 'react';

import { getFileContent } from '../../utils/deltaUtils';
import { getMonacoEdits, getRange } from '../../utils/monaco';
import { showWhitespaceAtom } from '../store/atoms';
import { useChangesStore } from '../store/changes';
import { useFilesStore } from '../store/files';

const modelPrev = monaco.editor.createModel('', 'typescript');
const modelCurrent = monaco.editor.createModel('', 'typescript');

export function EditorHighlightChange({ changeId }: { changeId: string }) {
  const monacoDom = useRef<HTMLDivElement>(null);
  const standaloneEditor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const diffEditor = useRef<monaco.editor.IStandaloneDiffEditor>();
  const diffNavigatorRef = useRef<monaco.IDisposable>();
  const currentChange = useChangesStore((s) => s.changes[changeId]);
  const activeFile = useFilesStore((s) => s.activeFile);
  const showWhitespace = useAtomValue(showWhitespaceAtom);
  const { currValue, prevValue } = useChangesStore((s) => {
    if (!activeFile) return {};

    const contentCurrent = getFileContent({
      upToChangeId: changeId,
      changes: s.changes,
    });

    const currentChange = s.changes[changeId];
    const changesOrder = Object.keys(s.changes).sort();
    const currentChangeIndex = changesOrder.findIndex((c) => c === changeId);
    const changesUpToChangeId = changesOrder
      .slice(0, currentChangeIndex)
      .map((id) => s.changes[id]);

    const prevChange = changesUpToChangeId.findLast(
      (c) => c.path === currentChange.path
    );

    if (activeFile.path !== currentChange.path) {
      const changeForTheFile = changesUpToChangeId
        .reverse()
        .find((c) => c.path === activeFile.path);

      if (changeForTheFile) {
        return {
          currValue: getFileContent({
            upToChangeId: changeForTheFile.id,
            changes: s.changes,
          }),
        };
      } else {
        return {
          currValue: '',
        };
      }
    } else if (!prevChange || prevChange.path !== currentChange.path) {
      return {
        currValue: contentCurrent,
      };
    } else {
      return {
        currValue: contentCurrent,
        prevValue: getFileContent({
          upToChangeId: prevChange.id,
          changes: s.changes,
        }),
      };
    }
  });

  useEffect(() => {
    if (!monacoDom.current) return;
    if (currValue === undefined) return;

    const noInserts = currentChange.stat[0] === 0;
    const noDeletes = currentChange.stat[1] === 0;

    const highlightDecorations = (model: monaco.editor.ITextModel) =>
      currentChange.highlight.map((h) => {
        return {
          range: getRange(model, h.offset, h.length),
          options: {
            className: 'select-highlight',
            overviewRuler: {
              color: '#3c5177',
              position: monaco.editor.OverviewRulerLane.Right,
            },
            minimap: { position: 1, color: '#3c5177' },
          },
        };
      });

    if (prevValue === undefined || noInserts || noDeletes) {
      standaloneEditor.current = monaco.editor.create(monacoDom.current, {
        automaticLayout: true,
        theme: 'darkTheme',
        readOnly: true,
        minimap: {
          enabled: true,
        },
      });

      standaloneEditor.current.setModel(modelCurrent);

      if (noInserts && noDeletes) {
        // no changes (only highlight)
        modelCurrent.setValue(currValue);

        standaloneEditor.current.createDecorationsCollection(
          highlightDecorations(modelCurrent)
        );
        standaloneEditor.current.revealRangeNearTop(
          highlightDecorations(modelCurrent)[0].range
        );
      } else if (noDeletes) {
        // only inserts
        modelCurrent.setValue(currValue);
        const edits = getMonacoEdits(currentChange.delta, modelCurrent);
        const decorations = edits.map((ed) => {
          return {
            range: ed.range,
            options: {
              className: 'insert-highlight',
              overviewRuler: {
                color: '#3f6212',
                position: monaco.editor.OverviewRulerLane.Right,
              },
              minimap: { position: 1, color: '#3f6212' },
            },
          };
        });

        standaloneEditor.current.createDecorationsCollection([
          ...decorations,
          ...highlightDecorations(modelCurrent),
        ]);
        standaloneEditor.current.revealRangeNearTop(decorations[0].range);
      } else if (noInserts && prevValue) {
        // only deletes
        modelCurrent.setValue(prevValue);
        const edits = getMonacoEdits(currentChange.delta, modelCurrent);
        const decorations = edits.map((ed) => {
          return {
            range: ed.range,
            options: {
              className: 'delete-highlight',
              overviewRuler: {
                color: '#991b1b',
                position: monaco.editor.OverviewRulerLane.Right,
              },
              minimap: { position: 1, color: '#991b1b' },
            },
          };
        });

        standaloneEditor.current.createDecorationsCollection([
          ...decorations,
          ...highlightDecorations(modelCurrent),
        ]);
        standaloneEditor.current.revealRangeNearTop(decorations[0].range);
      }
    } else {
      modelCurrent.setValue(currValue);
      modelPrev.setValue(prevValue);

      if (!diffEditor.current) {
        diffEditor.current = monaco.editor.createDiffEditor(monacoDom.current, {
          automaticLayout: true,
          theme: 'darkTheme',
          readOnly: true,
          renderSideBySide: false,
          glyphMargin: true,
          ignoreTrimWhitespace: !showWhitespace,
          renderMarginRevertIcon: false,
        });

        diffEditor.current.setModel({
          original: modelPrev,
          modified: modelCurrent,
        });

        diffNavigatorRef.current = monaco.editor.createDiffNavigator(
          diffEditor.current,
          {
            alwaysRevealFirst: true,
          }
        );

        diffEditor.current
          .getModifiedEditor()
          .createDecorationsCollection(highlightDecorations(modelCurrent));
      }
    }

    return () => {
      diffNavigatorRef.current?.dispose();
      standaloneEditor.current?.dispose();
      standaloneEditor.current = undefined;

      diffEditor.current?.dispose();
      diffEditor.current = undefined;
    };
  }, [currValue, prevValue, showWhitespace, currentChange]);

  return <div ref={monacoDom} className="monaco read-mode"></div>;
}
