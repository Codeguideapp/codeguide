import React from 'react';
import { Stage, Layer, Rect } from 'react-konva';

export const App = () => {
  const PADDING = 0;

  const stageRef = React.useRef<any>(null);

  const [layerX, setLayerX] = React.useState(0);
  //const [scrollbarX, setScrollbarX] = React.useState(PADDING);
  const [zoom, setZoom] = React.useState(1);

  const stageWidth = window.innerWidth;

  const START_WIDTH = 3000;
  const maxZoom = stageWidth / START_WIDTH;

  const canvasWidth = React.useMemo(() => START_WIDTH * zoom, [zoom]);
  const horizontalBarWidth = React.useMemo(
    () =>
      Math.max(
        0,
        Math.min(stageWidth * (stageWidth / canvasWidth), stageWidth)
      ),
    [stageWidth, canvasWidth]
  );

  const scrollbarX = React.useMemo(
    () =>
      canvasWidth === stageWidth
        ? 0
        : (layerX / (-canvasWidth + stageWidth)) *
            (stageWidth - PADDING * 2 - horizontalBarWidth) +
          PADDING,
    [layerX, canvasWidth, stageWidth, horizontalBarWidth]
  );

  var scaleBy = 1.04;
  return (
    <Stage
      width={window.innerWidth}
      height={300}
      style={{ background: '#f3f3f3' }}
      ref={stageRef}
      onWheel={(e) => {
        e.evt.preventDefault();
        if (e.evt.ctrlKey) {
          const oldZoom = zoom;
          const pointer = stageRef.current.getPointerPosition();

          const mousePointTo = (pointer.x - layerX) / oldZoom;
          const newScale = Math.max(
            e.evt.deltaY < 0 ? oldZoom * scaleBy : oldZoom / scaleBy,
            maxZoom
          );

          setZoom(newScale);
          const newLayerX = pointer.x - mousePointTo * newScale;
          if (newLayerX < 0) {
            // only moving to "the right"
            setLayerX(newLayerX);
          }
        } else if (zoom !== maxZoom) {
          const dx = e.evt.deltaX;

          const minX = -(canvasWidth - stageWidth);
          const maxX = 0;

          const x = Math.max(minX, Math.min(layerX - dx, maxX));
          setLayerX(x);
        }
      }}
    >
      <Layer>
        <Rect
          x={scrollbarX}
          y={285}
          width={horizontalBarWidth}
          height={10}
          fill="grey"
          opacity={0.8}
          draggable
          dragBoundFunc={(pos) => {
            return {
              x: Math.max(
                Math.min(pos.x, stageWidth - horizontalBarWidth - PADDING),
                PADDING
              ),
              y: 285,
            };
          }}
          onDragMove={(event) => {
            const pos = event.target.getPosition();

            const availableWidth =
              stageWidth - PADDING * 2 - horizontalBarWidth;

            if (availableWidth > 0) {
              const delta = (pos.x - PADDING) / availableWidth;

              setLayerX(-(canvasWidth - stageWidth) * delta);
            }
          }}
        />
      </Layer>
      <Changes layerX={layerX} zoom={zoom} />
    </Stage>
  );
};
export default App;

type Change = {
  x: number;
  color: string;
  width: number;
};

function Changes({ layerX, zoom }: { layerX: number; zoom: number }) {
  // used for displaying change "ghost" so it snaps back in that position on dragEnd
  const [snapPosX, setSnapPosX] = React.useState(-1);

  const [changes, setChanges] = React.useState<Record<string, Change>>({
    prvi: {
      x: 100,
      width: 100,
      color: 'blue',
    },
    drugi: {
      x: 300,
      width: 100,
      color: 'red',
    },
    treci: {
      x: 500,
      width: 100,
      color: 'green',
    },
  });

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
            y={100}
            width={change.width}
            height={100}
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

                setChanges({
                  ...changes,
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
                setChanges({
                  ...changes,
                  [id]: {
                    ...change,
                    x: pos.x,
                  },
                });
              }
            }}
            onDragEnd={() => {
              setChanges({
                ...changes,
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
                y: 100,
              };
            }}
          />
        );
      })}

      {snapPosX !== -1 && (
        <Rect
          x={snapPosX}
          y={100}
          width={100}
          height={100}
          stroke="black"
          radius={50}
        />
      )}
    </Layer>
  );
}
