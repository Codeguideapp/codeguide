import { useAtom } from 'jotai';
import React from 'react';
import { Layer, Rect, Stage } from 'react-konva';

import {
  layoutSplitRatioAtom,
  windowHeightAtom,
  windowWidthAtom,
} from '../atoms/layout';
import { Changes } from './Changes';
import { Playhead } from './Playhead';

const topBarHeight = 18;

export const Timeline = () => {
  const [layoutSplitRatio] = useAtom(layoutSplitRatioAtom);
  const [windowHeight] = useAtom(windowHeightAtom);
  const [stageWidth] = useAtom(windowWidthAtom);

  const stageHeight = React.useMemo(
    () => Math.ceil(windowHeight * (layoutSplitRatio[0] / 100)) - topBarHeight,
    [layoutSplitRatio, windowHeight]
  );

  const PADDING = 0;

  const stageRef = React.useRef<any>(null);

  const [layerX, setLayerX] = React.useState(0);
  //const [scrollbarX, setScrollbarX] = React.useState(PADDING);
  const [zoom, setZoom] = React.useState(1);

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
    <div>
      <div className="timeline-top" style={{ height: topBarHeight }}></div>
      <Stage
        width={window.innerWidth}
        height={stageHeight}
        style={{ background: '#1F2428' }}
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
        <Changes
          layerX={layerX}
          zoom={zoom}
          height={100}
          y={(stageHeight - 100) / 2}
        />
        <Playhead layerX={layerX} zoom={zoom} height={stageHeight - 10} />
        <Layer>
          <Rect
            x={scrollbarX}
            y={stageHeight - 10}
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
                y: stageHeight - 10,
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
      </Stage>
    </div>
  );
};
