import React from 'react';
import { useCallback } from 'react';
import { Group, Layer, Rect } from 'react-konva';

import { useStore } from '../store/store';

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
  const changes = useStore(useCallback((state) => state.changes, []));
  const updateStore = useStore(useCallback((state) => state.updateStore, []));
  const updateChangesOrder = useStore(
    useCallback((state) => state.updateChangesOrder, [])
  );

  // changes but updated only if ordering is changed
  const staticChanges = React.useMemo(
    () => changes,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapPosX] // recalculate only when snap position is changed
  );

  return (
    <Layer x={layerX} scaleX={zoom}>
      {Object.entries(changes).map(([id, change]) => {
        return (
          <Group
            key={id}
            x={change.x}
            y={y}
            draggable
            onDragStart={() => {
              updateStore((store) => {
                for (const depId of change.deps) {
                  store.changes[depId].highlightAsDep = true;
                }
              });

              setSnapPosX(change.x);
            }}
            onDragMove={(event) => {
              const pos = event.target.getPosition();

              const shouldSwap = Object.entries(staticChanges).find(
                ([, c]) => c.x < change.x && c.x + c.width > change.x
              );

              const swapFrom = id;
              const swapTo = shouldSwap?.[0];

              if (swapTo && swapFrom !== swapTo) {
                if (
                  changes[swapFrom].isDraft ||
                  changes[swapTo].isDraft ||
                  change.deps.includes(swapTo) ||
                  changes[swapTo].deps.includes(swapFrom)
                ) {
                  return;
                }

                updateStore(({ changes }) => {
                  changes[swapFrom].x = staticChanges[swapTo].x;
                  changes[swapTo].x = staticChanges[swapFrom].x;
                });

                updateChangesOrder(swapFrom, swapTo);

                setSnapPosX(changes[swapTo].x);
              } else {
                updateStore(({ changes }) => {
                  changes[id].x = pos.x;
                });
              }
            }}
            onDragEnd={() => {
              updateStore(({ changes }) => {
                changes[id].x = snapPosX;
                for (const depId of change.deps) {
                  changes[depId].highlightAsDep = false;
                }
              });
              setSnapPosX(-1);
            }}
            dragBoundFunc={(pos) => {
              return {
                x: pos.x,
                y,
              };
            }}
          >
            <Rect fill={change.color} width={change.width} height={height} />
            {Object.entries(change.actions).map(([id, action], i) => (
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
            ))}
          </Group>
        );
      })}

      {snapPosX !== -1 && (
        <Rect x={snapPosX} y={y} width={100} height={height} stroke="black" />
      )}
    </Layer>
  );
}
