import React from 'react';
import { useCallback } from 'react';
import { Layer, Rect } from 'react-konva';
import { useStore } from '../store';

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
          <Rect
            key={id}
            x={change.x}
            y={y}
            width={change.width}
            height={height}
            draggable
            onDragStart={() => {
              setSnapPosX(change.x);
            }}
            onDragMove={(event) => {
              const pos = event.target.getPosition();

              const shouldSwap = Object.entries(staticChanges).find(
                ([, c]) => c.x < change.x && c.x + c.width > change.x
              );
              if (shouldSwap && id !== shouldSwap[0]) {
                // swapping positions
                const swapFrom = id;
                const swapTo = shouldSwap[0];

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
            fill={change.color}
            dragBoundFunc={(pos) => {
              return {
                x: pos.x,
                y,
              };
            }}
          />
        );
      })}

      {snapPosX !== -1 && (
        <Rect x={snapPosX} y={y} width={100} height={height} stroke="black" />
      )}
    </Layer>
  );
}
