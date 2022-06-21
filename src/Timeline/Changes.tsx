import { useAtom, useAtomValue } from 'jotai';
import React, { useMemo, useRef } from 'react';
import { Group, Layer, Rect, Text } from 'react-konva';

import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
  sortBy,
  swapChanges,
  updateChangesAtom,
  updateChangesX,
} from '../atoms/changes';
import { Change } from '../atoms/changes';

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
  const changesOrderRef = useRef<string[]>([]);
  const activeChangeId = useAtomValue(activeChangeIdAtom);

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

    return paths.map(({ path, ids }) => {
      const x = Math.min(...ids.map((id) => changes[id].x));
      const lastX = Math.max(
        ...ids.map((id) => changes[id].x + changes[id].width)
      );

      return {
        id: ids[0],
        path,
        x,
        lastX,
      };
    });
  }, [changes, changesOrder]);

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
          const swapFrom = first;

          return (
            <Group
              key={swapFrom.id}
              x={swapFrom.x * zoom}
              y={y}
              draggable
              onDragStart={() => {
                changesOrderRef.current = changesOrder;
              }}
              onDragMove={(event) => {
                const pos = event.target.getPosition();

                let swapToId = changesOrderRef.current.find(
                  (id) =>
                    changes[id].x < swapFrom.x &&
                    changes[id].x + changes[id].width > swapFrom.x
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
                    from: swapFrom.id,
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
                    changes[swapFrom.id].x = pos.x;
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

                return (
                  <Group key={changes[id].id}>
                    <Rect
                      x={
                        i === 0 ? 0 : changes[withChildren[i - 1]].width * zoom
                      }
                      fill={getColor(changes[id], activeChangeId, 'green')}
                      width={changes[id].width * zoom}
                      height={(inserts / total) * height}
                    />
                    <Rect
                      y={(inserts / total) * height}
                      x={
                        i === 0 ? 0 : changes[withChildren[i - 1]].width * zoom
                      }
                      fill={getColor(changes[id], activeChangeId, 'red')}
                      width={changes[id].width * zoom}
                      height={(deletes / total) * height}
                    />
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
                  stroke="#c2c2c2"
                  strokeWidth={1}
                />
              )}
            </Group>
          );
        })}

      {snapPosX !== -1 && (
        <Rect x={snapPosX} y={y} width={50} height={height} stroke="black" />
      )}
    </Layer>
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
