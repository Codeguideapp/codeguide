import { Card } from 'antd';
import { useAtom } from 'jotai';
import { findLast } from 'lodash';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';
import React, { useEffect, useRef, useState } from 'react';
import Split from 'react-split';

import { changesAtom, changesOrderAtom } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { layoutSplitRatioAtom, windowHeightAtom } from '../atoms/layout';
import { saveDeltaAtom } from '../atoms/saveDeltaAtom';
import { composeDeltas } from '../utils/deltaUtils';
import { getFileContent } from '../utils/getFileContent';
import { modifiedModel, originalModel } from '../utils/monaco';

const topOffset = 45 + 21;
const lineHeight = 18;

type DiffMarker = {
  op: 'replace' | 'insert' | 'delete';
  rangeInModified: monaco.Range;
  rangeInOriginal: monaco.Range;
}[];

export function EditorEditMode() {
  const modifiedContentListener = useRef<monaco.IDisposable>();
  const diffListener = useRef<monaco.IDisposable>();
  const diffMouseDownListener = useRef<monaco.IDisposable>();
  const rightEditorDom = useRef<HTMLDivElement>(null);
  const editorDiffDom = useRef<HTMLDivElement>(null);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor>();
  //const decorations = useRef<string[]>([]);
  const [activeFile] = useAtom(activeFileAtom);
  const [, saveDelta] = useAtom(saveDeltaAtom);
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [layoutSplitRatio] = useAtom(layoutSplitRatioAtom);
  const [windowHeight] = useAtom(windowHeightAtom);
  const editorHeight = React.useMemo(
    () =>
      Math.ceil(windowHeight * (layoutSplitRatio[1] / 100)) - topOffset + 35,
    [layoutSplitRatio, windowHeight]
  );

  const [lineNumbers, setLineNumbers] = useState(editorHeight);
  const [diffMarkers, setDiffMarkers] = useState<DiffMarker>([]);
  const [originalColored, setOriginalColored] = useState<string[]>([]);

  useEffect(() => {
    // initializing editor
    if (!editorDiffDom.current) return;

    editor.current?.dispose();
    diffListener.current?.dispose();
    diffMouseDownListener.current?.dispose();

    editor.current = monaco.editor.create(editorDiffDom.current, {
      automaticLayout: true,
      theme: 'defaultDark',
      glyphMargin: true,
      lineHeight,
      suggest: {},
    });

    const diffEditor = monaco.editor.createDiffEditor(
      document.createElement('div'),
      {
        automaticLayout: true,
        theme: 'defaultDark',
        glyphMargin: true,
        lineHeight,
      }
    );

    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    editor.current.setModel(modifiedModel);

    const calcDiff = () => {
      const lineChanges = diffEditor.getLineChanges();

      let markers: {
        op: 'replace' | 'insert' | 'delete';
        rangeInModified: monaco.Range;
        rangeInOriginal: monaco.Range;
      }[] = [];
      if (lineChanges) {
        for (const lineChange of lineChanges) {
          let op: 'replace' | 'insert' | 'delete' = 'replace';

          if (lineChange.charChanges) {
            for (const charChange of lineChange.charChanges) {
              if (charChange.originalEndLineNumber === 0) {
                op = 'delete';
              } else if (
                charChange.modifiedStartColumn ===
                  charChange.modifiedEndColumn &&
                charChange.modifiedStartLineNumber ===
                  charChange.modifiedEndLineNumber
              ) {
                op = 'insert';
              } else if (charChange.modifiedEndColumn === 0) {
                op = 'delete';
              } else {
                op = 'replace';
              }

              markers.push({
                op,
                rangeInModified: new monaco.Range(
                  charChange.modifiedStartLineNumber,
                  charChange.modifiedStartColumn,
                  charChange.modifiedEndLineNumber,
                  charChange.modifiedEndColumn
                ),
                rangeInOriginal: new monaco.Range(
                  charChange.originalStartLineNumber,
                  charChange.originalStartColumn,
                  charChange.originalEndLineNumber,
                  charChange.originalEndColumn
                ),
              });
            }
          } else {
            op = 'replace';

            if (lineChange.modifiedEndLineNumber === 0) {
              op = 'insert';
            } else if (lineChange.modifiedEndLineNumber === 0) {
              op = 'delete';
            }
            if (lineChange.originalEndLineNumber === 0) {
              op = 'delete';
            }

            markers.push({
              op,
              rangeInModified:
                lineChange.modifiedEndLineNumber === 0 // if 0, it is not found in modified, insert at the modifiedStartLineNumber
                  ? new monaco.Range(
                      lineChange.modifiedStartLineNumber,
                      1,
                      lineChange.modifiedStartLineNumber,
                      1
                    )
                  : new monaco.Range(
                      lineChange.modifiedStartLineNumber,
                      1,
                      lineChange.modifiedEndLineNumber + 1,
                      1
                    ),
              rangeInOriginal: new monaco.Range(
                lineChange.originalStartLineNumber,
                1,
                lineChange.originalEndLineNumber + 1,
                1
              ),
            });
          }
        }
      }

      // // sort
      // markers.sort((left, right) =>
      //   monaco.Range.compareRangesUsingStarts(
      //     left.rangeInModified,
      //     right.rangeInModified
      //   )
      // );

      setDiffMarkers(markers);

      // for (const change of lineChanges) {

      //   for (const charChange of change.charChanges || []) {
      //     const modifiedChangedVal = originalModel.getValueInRange(
      //       new monaco.Range(
      //         charChange.modifiedStartLineNumber,
      //         charChange.modifiedStartColumn,
      //         charChange.modifiedEndLineNumber,
      //         charChange.modifiedEndColumn
      //       )
      //     );

      //     const originalChangedVal = modifiedModel.getValueInRange(
      //       new monaco.Range(
      //         charChange.originalStartLineNumber,
      //         charChange.originalStartColumn,
      //         charChange.originalEndLineNumber,
      //         charChange.originalEndColumn
      //       )
      //     );

      //     if (modifiedChangedVal) {
      //       console.log('added', modifiedChangedVal);
      //     }
      //     if (originalChangedVal) {
      //       console.log('deleted', originalChangedVal);
      //     }
      //   }

      //   console.log(change);
      // }
    };
    calcDiff();
    diffListener.current = diffEditor.onDidUpdateDiff(calcDiff);
    // diffListener.current = diffEditor.current.onDidUpdateDiff(() => {
    //   if (!diffEditor.current) return;

    //   const modifiedEditor = diffEditor.current.getModifiedEditor();
    //   const lineChanges = diffEditor.current.getLineChanges() || [];
    //   const ranges = lineChanges.map(
    //     (l) =>
    //       new monaco.Range(
    //         l.modifiedStartLineNumber,
    //         0,
    //         l.modifiedEndLineNumber,
    //         1
    //       )
    //   );

    //   decorations.current = modifiedEditor.deltaDecorations(
    //     decorations.current,
    //     ranges.map((range) => {
    //       return {
    //         range,
    //         options: {
    //           glyphMarginClassName: 'diffglyph',
    //         },
    //       };
    //     })
    //   );
    // });

    // diffMouseDownListener.current = diffEditor.current
    //   .getModifiedEditor()
    //   .onMouseDown(diffGutterMouseHandler(diffEditor));

    return () => {
      editor.current?.dispose();
      diffListener.current?.dispose();
      //diffMouseDownListener.current?.dispose();
      modifiedContentListener.current?.dispose();
      modifiedModel.setValue('');
      originalModel.setValue('');
    };
  }, [editorDiffDom]);

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
        //console.log(spanPerLine);
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
    if (originalModel.getValue() !== goal) {
      originalModel.setValue(goal);
    }
    setLineNumbers(modifiedModel.getLineCount());

    modifiedContentListener.current = modifiedModel.onDidChangeContent((e) => {
      setLineNumbers(modifiedModel.getLineCount());
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

  // useEffect(() => {
  //   editor.current?.onDidScrollChange((e) => {
  //     // @ts-ignore
  //     rightEditorDom.current?.scrollTo({ top: e.scrollTop });
  //   });

  //   if (!rightEditorDom.current) return;
  // }, []);

  return (
    <Split
      className="split-editor"
      direction="horizontal"
      sizes={[60, 40]}
      gutterSize={1}
    >
      <div ref={editorDiffDom} className="monaco edit-mode"></div>
      <div
        ref={rightEditorDom}
        style={{
          position: 'relative',
          height: '100%',
          overflow: 'auto',
          background: 'rgb(32 36 40)',
        }}
      >
        {diffMarkers.map((marker, i) => (
          <div
            key={i}
            style={{ width: 200, border: '1px solid red', margin: 20 }}
          >
            <div style={{ margin: 0 }}>
              {marker.op === 'delete'
                ? 'deleted ' +
                  modifiedModel.getValueInRange(marker.rangeInModified)
                : marker.op === 'replace'
                ? 'replace ' +
                  modifiedModel.getValueInRange(marker.rangeInModified) +
                  'with ' +
                  originalModel.getValueInRange(marker.rangeInOriginal)
                : 'insert ' +
                  originalModel.getValueInRange(marker.rangeInOriginal)}
            </div>
          </div>
        ))}

        <div
          style={{
            position: 'absolute',
            width: 5,
            height: 5,
            top: (lineNumbers - 1) * 18 + editorHeight,
          }}
        ></div>
      </div>
    </Split>
  );
}
