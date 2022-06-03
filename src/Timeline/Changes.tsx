import { useAtom, useAtomValue } from 'jotai';
import React, { useRef } from 'react';
import { Group, Layer, Rect } from 'react-konva';

import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
  sortBy,
  swapChanges,
  updateChangesAtom,
  updateChangesX,
} from '../atoms/changes';
import { Change } from '../atoms/types';

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

  return (
    <Layer x={layerX} scaleX={zoom}>
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
              x={swapFrom.x}
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
                const [inserts, deletes] = parentChangeId
                  ? changes[parentChangeId].stat
                  : changes[id].stat;

                const total = inserts + deletes;

                return (
                  <Group key={changes[id].id}>
                    <Rect
                      x={i === 0 ? 0 : changes[withChildren[i - 1]].width}
                      fill={getColor(changes[id], activeChangeId, 'green')}
                      width={changes[id].width}
                      height={(inserts / total) * height}
                    />
                    <Rect
                      y={(inserts / total) * height}
                      x={i === 0 ? 0 : changes[withChildren[i - 1]].width}
                      fill={getColor(changes[id], activeChangeId, 'red')}
                      width={changes[id].width}
                      height={(deletes / total) * height}
                    />
                  </Group>
                );
              })}
              {activeChangeId && withChildren.includes(activeChangeId) && (
                <Rect
                  x={0}
                  width={withChildren.reduce(
                    (acc, id) => acc + changes[id].width,
                    0
                  )}
                  height={height}
                  stroke="#c2c2c2"
                  strokeWidth={1}
                />
              )}

              {/* {Object.entries(change.actions).map(([id, action], i) => (
                // todo: buttons with tooltips https://konvajs.org/docs/sandbox/Shape_Tooltips.html separate component - react with tooltip support?
                <Rect
                  key={id}
                  fill={action.color}
                  x={i * 10}
                  width={10}
                  height={10}
                  onClick={action.callback}
                  name={action.label}
                />
              ))} */}
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
