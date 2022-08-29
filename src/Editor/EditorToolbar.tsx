import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCodeCompare,
  faHighlighter,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'antd';
import { useAtom } from 'jotai';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import { useCallback } from 'react';

import { changesAtom, changesOrderAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { selectionsAtom } from '../atoms/monaco';
import { showWhitespaceAtom, useStepByStepDiffAtom } from '../atoms/options';
import { saveDeltaAtom } from '../atoms/saveDeltaAtom';
import { modifiedModel } from '../utils/monaco';
import { ReactComponent as WhitespaceIcon } from './whitespace.svg';

library.add(faHighlighter, faCodeCompare);

export function EditorToolbar() {
  const [activeFile] = useAtom(activeFileAtom);
  const [, saveDelta] = useAtom(saveDeltaAtom);
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [useStepByStepDiff, setUseStepByStepDiff] = useAtom(
    useStepByStepDiffAtom
  );
  const [selections] = useAtom(selectionsAtom);
  const [showWhitespace, setShowWhitespace] = useAtom(showWhitespaceAtom);

  const highligterClickHandler = useCallback(() => {
    if (!activeFile) return;

    saveDelta({
      delta: new Delta(),
      file: activeFile,
      highlight: selections.map((sel) => {
        if (
          activeFile.status !== 'added' &&
          !changesOrder.find((id) => changes[id].path === activeFile.path)
        ) {
          // this is first time change is saved for a file
          saveDelta({
            file: activeFile,
            isFileDepChange: true,
            delta: new Delta().insert(activeFile.oldVal),
            eolChar: modifiedModel.getEOL(),
          });
        }

        const start = modifiedModel.getOffsetAt(
          new monaco.Position(sel.startLineNumber, sel.startColumn)
        );
        const end = modifiedModel.getOffsetAt(
          new monaco.Position(sel.endLineNumber, sel.endColumn)
        );

        return {
          length: end - start,
          offset: start,
          type: 'selection',
          options: {
            className: 'select-highlight',
          },
        };
      }),
    });
  }, [activeFile, changes, changesOrder, saveDelta, selections]);

  return (
    <div className="editor-toolbar">
      <Tooltip
        title={`Step-By-Step Diff (BETA): ${useStepByStepDiff ? 'ON' : 'OFF'}`}
      >
        <FontAwesomeIcon
          icon="code-compare"
          style={{ color: useStepByStepDiff ? 'rgb(178 97 201)' : '#666' }}
          onClick={() => setUseStepByStepDiff(!useStepByStepDiff)}
        />
      </Tooltip>

      {!useStepByStepDiff && (
        <Tooltip title="Show Leading/Trailing Whitespace Differences">
          <WhitespaceIcon
            width={16}
            style={{ opacity: showWhitespace ? 1 : 0.4 }}
            onClick={() => setShowWhitespace(!showWhitespace)}
          />
        </Tooltip>
      )}

      {selections.length ? (
        <Tooltip title="Save selection">
          <FontAwesomeIcon
            icon="highlighter"
            style={{ cursor: 'pointer' }}
            onClick={highligterClickHandler}
          />
        </Tooltip>
      ) : (
        <Tooltip title="Select code in order to enable highlighter">
          <FontAwesomeIcon icon="highlighter" style={{ opacity: 0.2 }} />
        </Tooltip>
      )}
    </div>
  );
}
