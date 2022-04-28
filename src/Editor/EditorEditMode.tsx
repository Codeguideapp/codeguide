import { Card } from 'antd';
import { useAtom } from 'jotai';
import { findLast, last } from 'lodash';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useEffect, useRef, useState } from 'react';
import Split from 'react-split';

import { changesAtom, changesOrderAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { saveDeltaAtom } from '../atoms/saveDeltaAtom';
import { composeDeltas } from '../utils/deltaUtils';
import { getFileContent } from '../utils/getFileContent';
import { modifiedModel, originalModel, previewModel } from '../utils/monaco';

// fix highlight linija kad ima children

const lineHeight = 18;

type DiffMarker = {
  op: 'replace' | 'insert' | 'delete';
  newVal: string;
  modRange: monaco.Range;
  children: DiffMarker[];
};

const calcDiff = (
  diffEditor: monaco.editor.IStandaloneDiffEditor,
  setDiffMarkers: React.Dispatch<React.SetStateAction<DiffMarker[]>>
) => {
  const lineChanges = diffEditor.getLineChanges();

  let markers: DiffMarker[] = [];

  if (lineChanges) {
    for (const lineChange of lineChanges) {
      let children: DiffMarker[] = [];

      if (lineChange.charChanges) {
        let charOffset = 0;

        for (const charChange of lineChange.charChanges) {
          const isDeletion = charChange.originalEndLineNumber === 0;
          const isInsertion = charChange.modifiedEndLineNumber === 0;

          if (isInsertion && isDeletion) {
            // can happen when entire file is deleted/added
            // for some reason charChanges exists, but all ranges are 0
            continue;
          }
          if (isDeletion) {
            children.push({
              op: 'delete',
              modRange: new monaco.Range(
                charChange.modifiedStartLineNumber,
                charChange.modifiedStartColumn,
                charChange.modifiedEndLineNumber,
                charChange.modifiedEndColumn
              ),
              newVal: originalModel.getValueInRange(
                new monaco.Range(
                  charChange.originalStartLineNumber,
                  charChange.originalStartColumn,
                  charChange.originalEndLineNumber,
                  charChange.originalEndColumn
                )
              ),
              children: [],
            });
          } else if (isInsertion) {
            let newVal = originalModel.getValueInRange(
              new monaco.Range(
                charChange.originalStartLineNumber,
                charChange.originalStartColumn,
                charChange.originalEndLineNumber,
                charChange.originalEndColumn
              )
            );
            const maxColumn = originalModel.getLineMaxColumn(
              charChange.originalEndLineNumber
            );

            if (
              maxColumn === charChange.originalEndColumn &&
              lineChange.originalEndLineNumber !==
                charChange.originalEndLineNumber
            ) {
              newVal = newVal + originalModel.getEOL();
            }

            const insertInLine = diffEditor.getDiffLineInformationForOriginal(
              charChange.originalEndLineNumber
            )!.equivalentLineNumber;

            const insertInColumn = charChange.originalStartColumn - charOffset;

            children.push({
              op: 'insert',
              modRange: new monaco.Range(
                insertInLine,
                insertInColumn,
                insertInLine,
                insertInColumn
              ),
              newVal,
              children: [],
            });

            charOffset =
              charOffset +
              charChange.originalEndColumn -
              charChange.originalStartColumn;
          } else {
            children.push({
              op: 'replace',
              modRange: new monaco.Range(
                charChange.modifiedStartLineNumber,
                charChange.modifiedStartColumn,
                charChange.modifiedEndLineNumber,
                charChange.modifiedEndColumn
              ),
              newVal: originalModel.getValueInRange(
                new monaco.Range(
                  charChange.originalStartLineNumber,
                  charChange.originalStartColumn,
                  charChange.originalEndLineNumber,
                  charChange.originalEndColumn
                )
              ),
              children: [],
            });
          }
        }
      }

      const isDeletion = lineChange.originalEndLineNumber === 0;
      const isInsertion = lineChange.modifiedEndLineNumber === 0;

      if (isInsertion) {
        let newVal = originalModel.getValueInRange(
          new monaco.Range(
            lineChange.originalStartLineNumber,
            1,
            lineChange.originalEndLineNumber + 1,
            1
          )
        );

        const eqEnd = diffEditor.getDiffLineInformationForOriginal(
          lineChange.originalEndLineNumber + 1
        )!.equivalentLineNumber;

        if (modifiedModel.getLineCount() < eqEnd) {
          // it wont be able to add it at the end since the line doesn't exist
          // add EOL at the beginning
          newVal = originalModel.getEOL() + newVal;
        }

        markers.push({
          op: 'insert',
          modRange: new monaco.Range(eqEnd, 1, eqEnd, 1),
          newVal,
          children,
        });
      } else if (isDeletion) {
        markers.push({
          op: 'delete',
          modRange: new monaco.Range(
            lineChange.modifiedStartLineNumber,
            1,
            lineChange.modifiedEndLineNumber + 1,
            1
          ),
          newVal: '',
          children,
        });
      } else {
        let newVal = originalModel.getValueInRange(
          new monaco.Range(
            lineChange.originalStartLineNumber,
            1,
            lineChange.originalEndLineNumber + 1,
            1
          )
        );

        const eqStart = diffEditor.getDiffLineInformationForOriginal(
          lineChange.originalStartLineNumber
        )!.equivalentLineNumber;

        const eqEnd = diffEditor.getDiffLineInformationForOriginal(
          lineChange.originalEndLineNumber + 1
        )!.equivalentLineNumber;

        markers.push({
          op: 'replace',
          modRange: new monaco.Range(eqStart, 1, eqEnd, 1),
          newVal,
          children,
        });
      }
    }
  }

  setDiffMarkers(markers);
};

export function EditorEditMode() {
  const modifiedContentListener = useRef<monaco.IDisposable>();
  const diffListener = useRef<monaco.IDisposable>();
  const diffMouseDownListener = useRef<monaco.IDisposable>();
  const monacoDom = useRef<HTMLDivElement>(null);
  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor>();
  const editor = useRef<monaco.editor.IStandaloneCodeEditor>();
  const decorations = useRef<string[]>([]);
  const [activeFile] = useAtom(activeFileAtom);
  const [, saveDelta] = useAtom(saveDeltaAtom);
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);

  const highlightUndo = useRef<
    {
      range: monaco.Range;
      text: string;
    }[]
  >([]);

  const [diffMarkers, setDiffMarkers] = useState<DiffMarker[]>([]);
  const [originalColored, setOriginalColored] = useState<string[]>([]);

  useEffect(() => {
    // initializing editor
    if (!monacoDom.current) return;

    editor.current?.dispose();
    diffListener.current?.dispose();
    diffMouseDownListener.current?.dispose();

    editor.current = monaco.editor.create(monacoDom.current, {
      automaticLayout: true,
      theme: 'defaultDark',
      glyphMargin: true,
      lineHeight,
      smoothScrolling: true,
    });

    diffEditorRef.current = monaco.editor.createDiffEditor(
      document.createElement('div'),
      {
        automaticLayout: true,
        theme: 'defaultDark',
        glyphMargin: true,
        lineHeight,
        ignoreTrimWhitespace: false,
      }
    );

    diffEditorRef.current.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    editor.current.setModel(modifiedModel);

    diffListener.current = diffEditorRef.current.onDidUpdateDiff((e) => {
      if (!diffEditorRef.current) return;
      calcDiff(diffEditorRef.current, setDiffMarkers);
    });

    return () => {
      editor.current?.dispose();
      diffEditorRef.current?.dispose();
      diffListener.current?.dispose();
      modifiedContentListener.current?.dispose();
      modifiedModel.setValue('');
      originalModel.setValue('');
    };
  }, [monacoDom]);

  useEffect(() => {
    modifiedContentListener.current?.dispose();

    if (!activeFile) {
      originalModel.setValue('');
      modifiedModel.setValue('');
      return;
    }

    setOriginalColored([]);
    monaco.editor
      .colorize(originalModel.getValue(), 'typescript', { tabSize: 2 })
      .then((html) => {
        const el = document.createElement('div');
        el.innerHTML = html;

        let spanPerLine = [];
        for (const child of el.children) {
          if (child.tagName === 'BR') {
            continue;
          }
          spanPerLine.push(child.innerHTML);
        }

        setOriginalColored(spanPerLine);
      });

    const previousChangeId = findLast(
      changesOrder,
      (id) => changes[id].path === activeFile.path
    );

    const current = previousChangeId
      ? getFileContent({
          changeId: previousChangeId,
          changes,
          changesOrder,
        })
      : activeFile.oldVal;

    const goal = activeFile.newVal;

    if (modifiedModel.getValue() !== current) {
      modifiedModel.setValue(current);
    }
    if (previewModel.getValue() !== current) {
      previewModel.setValue(current);
    }
    if (originalModel.getValue() !== goal) {
      originalModel.setValue(goal);
    }

    modifiedContentListener.current = modifiedModel.onDidChangeContent((e) => {
      const deltas: Delta[] = [];

      e.changes
        .sort((c1, c2) => c2.rangeOffset - c1.rangeOffset)
        .forEach((change) => {
          const delta = new Delta();
          delta.retain(change.rangeOffset);
          delta.delete(change.rangeLength);
          delta.insert(change.text);
          deltas.push(delta);
        });

      saveDelta(composeDeltas(deltas));
    });
  }, [activeFile, changesOrder, saveDelta]); // not watching changes as dep, because it is covered by changesOrder

  const diffMarkerMouseEnterHandle = (marker: DiffMarker) => () => {
    const viewstate = editor.current?.saveViewState();

    editor.current?.updateOptions({
      scrollbar: {
        vertical: 'hidden',
        horizontal: 'hidden',
      },
    });

    const modifiedValue = modifiedModel.getValue();
    const previewValue = previewModel.getValue();
    if (modifiedValue !== previewValue) {
      previewModel.setValue(modifiedValue);
    }

    editor.current?.setModel(previewModel);

    if (viewstate) {
      editor.current?.restoreViewState(viewstate);
    }

    if (marker.op === 'insert' || marker.op === 'replace') {
      const newDecorations = [];

      previewModel.applyEdits([
        {
          range: marker.modRange,
          text: marker.newVal,
        },
      ]);

      const highlightRange = getHighLightRange(marker);

      highlightUndo.current = [
        {
          range: highlightRange,
          text: '',
        },
      ];

      newDecorations.push({
        range: highlightRange,
        options: {
          className: `${
            marker.children.length === 0 ? 'highlight-no-child' : ''
          } ${marker.op}-highlight`,
        },
      });

      editor.current?.revealRangeInCenterIfOutsideViewport(
        highlightRange,
        monaco.editor.ScrollType.Smooth
      );

      for (const child of marker.children) {
        const childRange = getHighLightRange(child);
        newDecorations.push({
          range: childRange,
          options: {
            className: `child-highlight ${child.op}-highlight`,
          },
        });
      }

      decorations.current = editor.current!.deltaDecorations(
        decorations.current,
        newDecorations
      );
    } else if (marker.op === 'delete') {
      const oldVal = originalModel.getValueInRange(marker.modRange);
      // previewModel.applyEdits([
      //   {
      //     range: marker.modRange,
      //     text: '',
      //   },
      // ]);

      decorations.current = editor.current!.deltaDecorations(
        decorations.current,
        [
          {
            range: marker.modRange,
            options: {
              className: 'delete-highlight',
            },
          },
        ]
      );

      highlightUndo.current = [
        {
          range: marker.modRange,
          text: oldVal,
        },
      ];

      editor.current?.revealRangeInCenterIfOutsideViewport(
        marker.modRange,
        monaco.editor.ScrollType.Smooth
      );
    }
  };

  const diffMarkerMouseLeaveHandle = (marker: DiffMarker) => () => {
    previewModel.applyEdits(highlightUndo.current);
    highlightUndo.current = [];

    const viewstate = editor.current?.saveViewState();
    editor.current?.setModel(modifiedModel);
    if (viewstate) {
      editor.current?.restoreViewState(viewstate);
    }

    const modifiedValue = modifiedModel.getValue();
    const previewValue = previewModel.getValue();
    if (modifiedValue !== previewValue) {
      previewModel.setValue(modifiedValue);
    }

    editor.current?.updateOptions({
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
      },
    });
  };

  const diffMarkerClickHandle = (marker: DiffMarker) => () => {
    if (marker.op === 'insert' || marker.op === 'replace') {
      modifiedModel.applyEdits([
        {
          range: marker.modRange,
          text: marker.newVal,
        },
      ]);
    }
  };

  return (
    <Split
      className="split-editor"
      direction="horizontal"
      sizes={[60, 40]}
      gutterSize={1}
    >
      <div ref={monacoDom} className="monaco edit-mode"></div>
      <div
        style={{
          position: 'relative',
          height: '100%',
          overflow: 'auto',
          background: 'rgb(32 36 40)',
        }}
      >
        {diffMarkers.map((marker, i) => (
          <div key={i} style={{ background: 'rgb(40 49 56)', padding: 10 }}>
            {marker.children.map((child, cI) => (
              <div
                key={`${i}-${cI}`}
                style={{
                  width: '100%',
                  height: 50,
                  overflow: 'auto',
                  background: '#374957',
                  marginTop: 10,
                }}
                onMouseEnter={diffMarkerMouseEnterHandle(child)}
                onMouseLeave={diffMarkerMouseLeaveHandle(child)}
                onClick={diffMarkerClickHandle(child)}
              >
                <div style={{ margin: 0 }}>
                  {child.op} {child.newVal}
                </div>
              </div>
            ))}

            {marker.children.length !== 1 && (
              <div
                style={{
                  width: '100%',
                  height: 50,
                  marginTop: 10,
                  overflow: 'auto',
                  background: '#374957',
                }}
                onMouseEnter={diffMarkerMouseEnterHandle(marker)}
                onMouseLeave={diffMarkerMouseLeaveHandle(marker)}
                onClick={diffMarkerClickHandle(marker)}
              >
                <div style={{ margin: 0 }}>
                  {marker.children.length === 0 ? (
                    <div>
                      {marker.op} {marker.newVal}
                    </div>
                  ) : (
                    <div>all</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Split>
  );
}

function getHighLightRange(marker: DiffMarker) {
  const startOffset = previewModel.getOffsetAt(
    new monaco.Position(
      marker.modRange.startLineNumber,
      marker.modRange.startColumn
    )
  );
  const endOffset = startOffset + marker.newVal.length;
  const endPos = previewModel.getPositionAt(endOffset);

  return new monaco.Range(
    marker.modRange.startLineNumber,
    marker.modRange.startColumn,
    endPos.lineNumber,
    endPos.column
  );
}
