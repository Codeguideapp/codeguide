import { useAtom } from 'jotai';
import React from 'react';
import { Layer, Rect, Stage } from 'react-konva';

import {
  layoutSplitRatioAtom,
  windowHeightAtom,
  windowWidthAtom,
} from '../atoms/layout';
import {
  isPlayheadVisibleAtom,
  isPlayingAtom,
  refPlayheadXAtom,
  setPlayheadXAtom,
} from '../atoms/playhead';
import { Changes } from './Changes';
import { MediaControls } from './MediaControls';
import { Playhead, PreviewPlayhead } from './Playhead';

const topBarHeight = 19;
const gutterSize = 1;
const topOffset = topBarHeight + gutterSize;

export const Timeline = () => {
  const [layoutSplitRatio] = useAtom(layoutSplitRatioAtom);
  const [windowHeight] = useAtom(windowHeightAtom);
  const [stageWidth] = useAtom(windowWidthAtom);
  const [, setPlayheadX] = useAtom(setPlayheadXAtom);
  const [playHeadX] = useAtom(refPlayheadXAtom);
  const [, setPlayheadVisible] = useAtom(isPlayheadVisibleAtom);
  const [isPlaying] = useAtom(isPlayingAtom);

  const stageHeight = React.useMemo(
    () => Math.ceil(windowHeight * (layoutSplitRatio[1] / 100)) - topOffset,
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
      <div className="timeline-top" style={{ height: topBarHeight }}>
        <MediaControls />
      </div>
      <Stage
        className="timeline"
        width={window.innerWidth}
        height={stageHeight}
        ref={stageRef}
        onMouseLeave={() => {
          if (isPlaying) return;
          setPlayheadVisible(false);
          setPlayheadX({
            x: playHeadX,
            type: 'preview',
          });
        }}
        onMouseMove={(e) => {
          if (isPlaying) return;
          setPlayheadVisible(true);
          setPlayheadX({
            x: (e.evt.x - layerX) / zoom,
            type: 'preview',
          });
        }}
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
        onClick={(e) => {
          setPlayheadX({
            x: (e.evt.x - layerX) / zoom,
            type: 'ref',
          });
        }}
      >
        <Changes
          layerX={layerX}
          zoom={zoom}
          height={100}
          y={(stageHeight - 100) / 2}
        />
        <Playhead layerX={layerX} zoom={zoom} height={stageHeight - 10} />
        <PreviewPlayhead
          layerX={layerX}
          zoom={zoom}
          height={stageHeight - 10}
        />

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
