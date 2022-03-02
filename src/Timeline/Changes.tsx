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
  const saveChanges = useStore(useCallback((state) => state.saveChanges, []));

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
              setSnapPosX(change.x);
            }}
            onDragMove={(event) => {
              const pos = event.target.getPosition();

              const shouldSwap = Object.entries(staticChanges).find(
                ([, c]) => c.x < change.x && c.x + c.width > change.x
              );
              if (shouldSwap && id !== shouldSwap[0] && id) {
                // swapping positions
                const swapFrom = id;
                const swapTo = shouldSwap[0];

                if (swapFrom === 'draft' || swapTo === 'draft') {
                  return;
                }

                saveChanges({
                  [swapFrom]: {
                    ...changes[swapFrom],
                    x: staticChanges[swapTo].x,
                  },
                  [swapTo]: {
                    ...changes[swapTo],
                    x: staticChanges[swapFrom].x,
                  },
                });

                setSnapPosX(changes[swapTo].x);
              } else {
                saveChanges({
                  [id]: {
                    ...change,
                    x: pos.x,
                  },
                });
              }
            }}
            onDragEnd={() => {
              saveChanges({
                [id]: {
                  ...change,
                  x: snapPosX,
                },
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
