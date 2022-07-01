import { useAtom, useAtomValue } from 'jotai';
import { last } from 'lodash';
import React, { useMemo, useRef } from 'react';
import { Group, Layer, Rect, Text } from 'react-konva';

import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
  selectedChangeIdsAtom,
  sortBy,
  swapChanges,
  updateChangesAtom,
  updateChangesX,
} from '../atoms/changes';
import { Change } from '../atoms/changes';
import { activeFileAtom } from '../atoms/files';
import { contextMenuAtom, showAddCommentDialogAtom } from '../atoms/layout';
import { canEditAtom } from '../atoms/playhead';

export function Changes({
  layerX,
  zoom,
  y,
  height,
}: {
  layerX: number;
  zoom: number;
  y: number;
  height: number;
}) {
  // used for displaying change "ghost" so it snaps back in that position on dragEnd
  const [snapPosX, setSnapPosX] = React.useState(-1);
  const [changes] = useAtom(changesAtom);
  const [changesOrder, setChangesOrder] = useAtom(changesOrderAtom);
  const [, updateChanges] = useAtom(updateChangesAtom);
  const [, setContextMenu] = useAtom(contextMenuAtom);
  const changesOrderRef = useRef<string[]>([]);
  const activeChangeId = useAtomValue(activeChangeIdAtom);
  const [, setAhowAddCommentDialog] = useAtom(showAddCommentDialogAtom);
  const [selectedChangeIds, setSelectedChangeIds] = useAtom(
    selectedChangeIdsAtom
  );
  const activeFile = useAtomValue(activeFileAtom);

  const fileWrappers = useMemo(() => {
    const paths: {
      path: string;
      ids: string[];
    }[] = [];

    for (const id of changesOrder) {
      if (changes[id].isFileDepChange) {
        continue;
      }
      const lastIndex = paths.length - 1;
      if (paths[lastIndex]?.path !== changes[id].path) {
        paths.push({
          path: changes[id].path,
          ids: [id],
        });
      } else {
        paths[lastIndex].ids.push(id);
      }
    }

    const wrappers = paths.map(({ path, ids }) => {
      const x = Math.min(...ids.map((id) => changes[id].x));
      const lastX = Math.max(
        ...ids.map((id) => changes[id].x + changes[id].width)
      );

      return {
        id: ids[0],
        path,
        x,
        lastX: lastX,
      };
    });

    const lastChange = changes[last(changesOrder) || ''];
    if (lastChange && wrappers.length && activeFile?.path === lastChange.path) {
      wrappers[wrappers.length - 1].lastX += 50;
    } else if (activeFile) {
      const lastWrapper = last(wrappers);
      wrappers.push({
        id: 'draft',
        path: activeFile.path,
        x: (lastWrapper?.lastX || 0) + 35,
        lastX: (lastWrapper?.lastX || 0) + 75,
      });
    }

    return wrappers;
  }, [changes, changesOrder, activeFile]);

  return (
    <Layer x={layerX}>
      {fileWrappers.map((fileWrapper) => {
        const fileName = fileWrapper.path.split('/').pop()!;
        const width = (fileWrapper.lastX - fileWrapper.x) * zoom;
        const maxChars = width / 6; // px to char size
        let text = fileName.slice(0, maxChars);

        if (fileName.length > maxChars) {
          text = text.slice(0, text.length - 3);
          text += '...';
        }

        return (
          <Group key={fileWrapper.id}>
            <Rect
              y={y - 30}
              x={fileWrapper.x * zoom - 10}
              fill={'#2C3137'}
              width={width + 20}
              height={height + 40}
              cornerRadius={4}
            />
            <Text
              x={fileWrapper.x * zoom}
              y={y - 20}
              fontFamily="Menlo, Monaco, monospace"
              fontSize={10}
              text={text}
              fill="#C2B6B6"
            />
          </Group>
        );
      })}
      {Object.values(changes)
        .filter((change) => !change.isFileDepChange && !change.parentChangeId)
        .map((change) => {
          const withChildren = [change.id, ...change.children].sort(
            sortBy(changesOrder)
          );
          const first = changes[withChildren[0]];
          const refChange = first;

          return (
            <Group
              key={refChange.id}
              x={refChange.x * zoom}
              y={y}
              draggable
              onContextMenu={(e) => {
                if (selectedChangeIds.length === 0) {
                  setSelectedChangeIds([
                    refChange.parentChangeId || refChange.id,
                  ]);
                }

                setContextMenu({
                  left: e.evt.pageX,
                  top: e.evt.pageY,
                  items: [
                    {
                      label: 'Add Comment',
                      onClick: () => setAhowAddCommentDialog(true),
                    },
                  ],
                });
                e.evt.stopPropagation();
                e.evt.preventDefault();
              }}
              onDragStart={() => {
                changesOrderRef.current = changesOrder;
              }}
              onDragMove={(event) => {
                const pos = event.target.getPosition();

                let swapToId = changesOrderRef.current.find(
                  (id) =>
                    changes[id].x < refChange.x &&
                    changes[id].x + changes[id].width > refChange.x
                );

                try {
                  if (!swapToId) {
                    throw new Error('invalid "to" param');
                  }

                  swapToId = changes[swapToId].parentChangeId || swapToId;
                  const swapToWithChildren = [
                    swapToId,
                    ...changes[swapToId].children,
                  ].sort(sortBy(changesOrder));
                  swapToId = swapToWithChildren[0];

                  const newChangesOrder = swapChanges({
                    changes,
                    changesOrder,
                    from: refChange.id,
                    to: swapToId,
                    length: withChildren.length,
                  });

                  changesOrderRef.current = newChangesOrder;

                  setChangesOrder(newChangesOrder);
                  updateChanges(updateChangesX(changesOrderRef.current));
                  setSnapPosX(changes[swapToId].x);
                } catch (err) {
                  // forbidden swap, ignore here
                  updateChanges((changes) => {
                    changes[refChange.id].x = pos.x;
                  });
                  return;
                }
              }}
              onDragEnd={() => {
                updateChanges(updateChangesX(changesOrderRef.current));
                setSnapPosX(-1);
              }}
              dragBoundFunc={(pos) => {
                return {
                  x: pos.x,
                  y,
                };
              }}
            >
              {withChildren.map((id, i) => {
                const parentChangeId = changes[id].parentChangeId;
                const stat = parentChangeId
                  ? changes[parentChangeId].stat
                  : changes[id].stat;

                const [inserts, deletes] = stat || [1, 0];
                const total = inserts + deletes;
                const heightWoSubtitle = changes[id].text
                  ? height - 15
                  : height;

                return (
                  <Group
                    key={changes[id].id}
                    x={i === 0 ? 0 : changes[withChildren[i - 1]].width * zoom}
                  >
                    <Rect
                      x={0}
                      fill={getColor(changes[id], activeChangeId, 'green')}
                      width={changes[id].width * zoom}
                      height={(inserts / total) * heightWoSubtitle}
                    />
                    <Rect
                      y={(inserts / total) * heightWoSubtitle}
                      x={0}
                      fill={getColor(changes[id], activeChangeId, 'red')}
                      width={changes[id].width * zoom}
                      height={(deletes / total) * heightWoSubtitle}
                    />
                    {changes[id].text && (
                      <Rect
                        y={height - 10}
                        x={0}
                        fill={
                          changes[id].textType === 'question'
                            ? '#74188B'
                            : changes[id].textType === 'warn'
                            ? '#8B5D18'
                            : '#23688E'
                        }
                        width={changes[id].width * zoom}
                        height={10}
                      />
                    )}
                  </Group>
                );
              })}
              {activeChangeId && withChildren.includes(activeChangeId) && (
                <Rect
                  x={0}
                  width={withChildren.reduce(
                    (acc, id) => acc + changes[id].width * zoom,
                    0
                  )}
                  height={height}
                  stroke="#9E9E9E"
                  strokeWidth={1}
                />
              )}
              {selectedChangeIds.includes(
                change.parentChangeId || change.id
              ) && (
                <Rect
                  x={0}
                  width={withChildren.reduce(
                    (acc, id) => acc + changes[id].width * zoom,
                    0
                  )}
                  height={height}
                  stroke="yellow"
                  strokeWidth={1}
                />
              )}
            </Group>
          );
        })}
      {snapPosX !== -1 && (
        <Rect x={snapPosX} y={y} width={50} height={height} stroke="black" />
      )}
      <DraftChange y={y} height={height} zoom={zoom} />
    </Layer>
  );
}

function DraftChange({
  y,
  height,
  zoom,
}: {
  y: number;
  height: number;
  zoom: number;
}) {
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [canEdit] = useAtom(canEditAtom);
  const activeFile = useAtomValue(activeFileAtom);

  if (!activeFile) {
    return null;
  }

  const lastId = last(changesOrder);
  const lastChange = lastId ? changes[lastId] : undefined;

  let x = lastChange ? lastChange.x + lastChange.width : 0;

  return (
    <Rect
      x={
        activeFile.path === lastChange?.path ? (x + 10) * zoom : (x + 35) * zoom
      }
      y={y}
      width={40 * zoom}
      height={height}
      stroke="#9E9E9E"
      fill="#32383f"
      strokeWidth={canEdit ? 1 : 0}
      dash={[2, 2]}
    />
  );
}

function getColor(
  change: Change,
  activeId: string | null,
  color: 'green' | 'red'
) {
  const activeHighlight = color === 'green' ? '#628A70' : '#9B5B63';
  const nonActiveHighlight = color === 'green' ? '#3A704D' : '#87313B';
  const activeChange = color === 'green' ? '#12562A' : '#720714';
  const nonActiveChange = activeChange;

  if (change.parentChangeId) {
    if (activeId === change.id) {
      return activeHighlight;
    } else {
      return nonActiveHighlight;
    }
  } else {
    if (activeId === change.id) {
      return activeChange;
    } else {
      return nonActiveChange;
    }
  }
}
