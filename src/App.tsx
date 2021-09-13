import React from "react";
import { Stage, Layer, Rect } from "react-konva";

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
      style={{ background: "#f3f3f3" }}
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

function Changes({ layerX, zoom }: { layerX: number; zoom: number }) {
  const [changes, setChanges] = React.useState({
    prvi: {
      x: 100,
      color: "blue",
    },
    drugi: {
      x: 300,
      color: "red",
    },
  });

  const [lastX, setLastX] = React.useState(-1);

  return (
    <Layer x={layerX} scaleX={zoom}>
      {Object.entries(changes).map(([id, change]) => {
        return (
          <Rect
            key={id}
            x={change.x}
            y={100}
            width={100}
            height={100}
            draggable
            onDragStart={() => {
              setLastX(change.x);
            }}
            onDragMove={(event) => {
              const pos = event.target.getPosition();
              setChanges({
                ...changes,
                [id]: {
                  ...change,
                  x: pos.x,
                },
              });
            }}
            onDragEnd={() => {
              setChanges({
                ...changes,
                [id]: {
                  ...change,
                  x: lastX,
                },
              });
              setLastX(-1);
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

      {lastX !== -1 && (
        <Rect
          x={lastX}
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
