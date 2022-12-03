import { useAtomValue } from 'jotai';
import * as monaco from 'monaco-editor';
import { useEffect, useRef } from 'react';

import { showWhitespaceAtom } from '../store/atoms';
import { useChangesStore } from '../store/changes';
import { useFilesStore } from '../store/files';
import { getFileContent } from '../utils/deltaUtils';
import { getRange } from '../utils/monaco';

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
    const prevChange = s.changes[changesOrder[currentChangeIndex - 1]];

    if (activeFile.path !== currentChange.path) {
      const changesUpToChangeId = changesOrder
        .slice(0, currentChangeIndex)
        .map((id) => s.changes[id]);

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

    if (currValue !== undefined && prevValue === undefined) {
      modelCurrent.setValue(currValue);

      standaloneEditor.current = monaco.editor.create(monacoDom.current, {
        automaticLayout: true,
        theme: 'darkTheme',
        readOnly: true,
      });
      standaloneEditor.current.setModel(modelCurrent);
    }

    if (currValue !== undefined && prevValue !== undefined) {
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

        diffEditor.current.getModifiedEditor().createDecorationsCollection(
          currentChange.highlight.map((h) => {
            return {
              range: getRange(modelCurrent, h.offset, h.length),
              options: {
                className: 'select-highlight',
                overviewRuler: {
                  color: '#3c5177',
                  position: monaco.editor.OverviewRulerLane.Right,
                },
              },
            };
          })
        );

        if (
          currentChange.stat[0] === 0 &&
          currentChange.stat[1] === 0 &&
          currentChange.highlight.length
        ) {
          diffEditor.current
            .getModifiedEditor()
            .revealRangeInCenterIfOutsideViewport(
              getRange(
                modelCurrent,
                currentChange.highlight[0].offset,
                currentChange.highlight[0].length
              )
            );
        }
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
