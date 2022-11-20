import { useAtomValue } from 'jotai';
import * as monaco from 'monaco-editor';
import { useEffect, useRef } from 'react';

import { changesAtom, changesOrderAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { showWhitespaceAtom } from '../atoms/layout';
import { getFileContent } from '../utils/deltaUtils';
import { getRange } from '../utils/monaco';

const modelPrev = monaco.editor.createModel('', 'typescript');
const modelCurrent = monaco.editor.createModel('', 'typescript');

export function EditorHighlightChange({ changeId }: { changeId: string }) {
  const monacoDom = useRef<HTMLDivElement>(null);
  const standaloneEditor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const diffEditor = useRef<monaco.editor.IStandaloneDiffEditor>();
  const diffNavigatorRef = useRef<monaco.IDisposable>();
  const changes = useAtomValue(changesAtom);
  const changesOrder = useAtomValue(changesOrderAtom);
  const activeFile = useAtomValue(activeFileAtom);
  const showWhitespace = useAtomValue(showWhitespaceAtom);

  useEffect(() => {
    if (!monacoDom.current) return;
    if (!activeFile) return;

    const contentCurrent = getFileContent({
      upToChangeId: changeId,
      changes,
      changesOrder,
    });

    const currentChange = changes[changeId];
    const currentChangeIndex = changesOrder.findIndex((c) => c === changeId);
    const prevChange = changes[changesOrder[currentChangeIndex - 1]];

    if (activeFile.path !== currentChange.path) {
      const changesUpToChangeId = changesOrder
        .slice(0, currentChangeIndex)
        .map((id) => changes[id]);

      const changeForTheFile = changesUpToChangeId
        .reverse()
        .find((c) => c.path === activeFile.path);

      if (changeForTheFile) {
        modelCurrent.setValue(
          getFileContent({
            upToChangeId: changeForTheFile.id,
            changes,
            changesOrder,
          })
        );
      } else {
        modelCurrent.setValue(''); // todo
      }

      standaloneEditor.current = monaco.editor.create(monacoDom.current, {
        automaticLayout: true,
        theme: 'darkTheme',
        readOnly: true,
      });
      standaloneEditor.current.setModel(modelCurrent);
    } else if (!prevChange || prevChange.path !== currentChange.path) {
      modelCurrent.setValue(contentCurrent);

      standaloneEditor.current = monaco.editor.create(monacoDom.current, {
        automaticLayout: true,
        theme: 'darkTheme',
        readOnly: true,
      });
      standaloneEditor.current.setModel(modelCurrent);
    } else {
      const contentPrev = getFileContent({
        upToChangeId: prevChange.id,
        changes,
        changesOrder,
      });

      modelCurrent.setValue(contentCurrent);
      modelPrev.setValue(contentPrev);

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
      }

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

    return () => {
      diffNavigatorRef.current?.dispose();
      standaloneEditor.current?.dispose();
      standaloneEditor.current = undefined;

      diffEditor.current?.dispose();
      diffEditor.current = undefined;
    };
  }, [changes, changesOrder, activeFile, changeId, monacoDom, showWhitespace]);

  return <div ref={monacoDom} className="monaco read-mode"></div>;
}
