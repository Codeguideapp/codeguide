import { Slider } from 'antd';
import { useAtom } from 'jotai';
import type Konva from 'konva';
import React, { useCallback, useEffect, useRef } from 'react';
import { Layer, Rect, Stage } from 'react-konva';

import {
  changesAtom,
  changesOrderAtom,
  selectedChangeIdsAtom,
} from '../atoms/changes';
import {
  layoutSplitRatioAtom,
  windowHeightAtom,
  windowWidthAtom,
} from '../atoms/layout';
import {
  isPlayheadVisibleAtom,
  refPlayheadXAtom,
  scrollToAtom,
  setPlayheadXAtom,
} from '../atoms/playhead';
import { Changes } from './Changes';
import { MediaControls } from './MediaControls';
import { Playhead, PreviewPlayhead } from './Playhead';
import { TimelineMenu } from './TimelineMenu';

const topBarHeight = 19;
const gutterSize = 1;
const topOffset = topBarHeight + gutterSize;

export const Timeline = () => {
  const [layoutSplitRatio] = useAtom(layoutSplitRatioAtom);
  const [windowHeight] = useAtom(windowHeightAtom);
  const [stageWidth] = useAtom(windowWidthAtom);
  const [, setPlayheadX] = useAtom(setPlayheadXAtom);
  const [refPlayHeadX] = useAtom(refPlayheadXAtom);
  const [, setPlayheadVisible] = useAtom(isPlayheadVisibleAtom);
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [scrollToX] = useAtom(scrollToAtom);
  const [, setSelectedChangeIds] = useAtom(selectedChangeIdsAtom);
  const interval = useRef<NodeJS.Timeout>();

  const stageHeight = React.useMemo(
    () => Math.ceil(windowHeight * (layoutSplitRatio[1] / 100)) - topOffset,
    [layoutSplitRatio, windowHeight]
  );

  const PADDING = 0;

  const stageRef = React.useRef<any>(null);
  const scrollbarXRef = React.useRef<Konva.Rect>(null);

  const [layerX, setLayerX] = React.useState(0);

  const maxZoom = 5;
  const minZoom = 1 / maxZoom;
  const scaleBy = 1 + minZoom;

  const [zoom, setZoom] = React.useState(1);

  const canvasWidth = React.useMemo(() => {
    const lastId = changesOrder.slice(-1)[0];
    const lastX = lastId ? changes[lastId].x + changes[lastId].width + 100 : 0;
    const width = lastX * zoom;
    if (width > stageWidth) {
      return width;
    } else {
      return stageWidth;
    }
  }, [zoom, stageWidth, changes, changesOrder]);

  const horizontalBarWidth = React.useMemo(() => {
    if (stageWidth >= canvasWidth) {
      return 0;
    }
    return Math.max(
      0,
      Math.min(stageWidth * (stageWidth / canvasWidth), stageWidth)
    );
  }, [stageWidth, canvasWidth]);

  const scrollbarX = React.useMemo(
    () =>
      canvasWidth === stageWidth
        ? 0
        : (layerX / (-canvasWidth + stageWidth)) *
            (stageWidth - PADDING * 2 - horizontalBarWidth) +
          PADDING,
    [layerX, canvasWidth, stageWidth, horizontalBarWidth]
  );

  const scrollToXFn = useCallback(
    (x: number) => {
      const min = 0;
      const max = canvasWidth - stageWidth;

      setLayerX((prev) => {
        const newLayerX = -Math.max(
          min,
          Math.min((x + 10) * zoom - stageWidth, max)
        );

        if (newLayerX < prev) {
          return newLayerX;
        } else {
          return prev;
        }
      });
    },
    [canvasWidth, stageWidth, zoom]
  );

  useEffect(() => {
    scrollToXFn(scrollToX);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToX]);

  const sliderSteps = 9;

  return (
    <div>
      <div className="timeline-top" style={{ height: topBarHeight }}>
        <TimelineMenu />
        <MediaControls />
        <div>
          <Slider
            min={1}
            max={sliderSteps}
            step={1}
            value={
              zoom < 1
                ? zoom * Math.ceil(sliderSteps / 2)
                : zoom + Math.floor(sliderSteps / 2)
            }
            onChange={(val) => {
              if (val >= Math.ceil(sliderSteps / 2)) {
                setZoom(val - Math.floor(sliderSteps / 2));
              } else {
                setZoom(val / Math.ceil(sliderSteps / 2));
              }
            }}
            tipFormatter={() => {
              return `Zoom: ${(Math.round(zoom * 100) / 100).toFixed(1)}x`;
            }}
            style={{ width: 80, height: 19, margin: '3px 10px' }}
          />
        </div>
      </div>
      <Stage
        className="timeline"
        width={window.innerWidth}
        height={stageHeight}
        ref={stageRef}
        onMouseLeave={() => {
          setPlayheadVisible(false);
          setPlayheadX({
            x: refPlayHeadX,
            type: 'preview',
          });
        }}
        onMouseMove={(e) => {
          const x = (e.evt.x - layerX) / zoom;
          const rightMax = stageWidth - 20;

          setPlayheadVisible(true);
          setPlayheadX({ x, type: 'preview' });

          if (interval.current) clearInterval(interval.current);

          if (e.evt.x > rightMax) {
            interval.current = setInterval(
              () =>
                setLayerX((prev) => {
                  if (!scrollbarXRef.current) {
                    clearInterval(interval.current!);
                    return prev;
                  }

                  const x = scrollbarXRef.current.x();
                  const width = scrollbarXRef.current.width();
                  const scrollbarEndX = x + width;

                  if (width && scrollbarEndX < stageWidth) {
                    return prev - 4;
                  } else {
                    clearInterval(interval.current!);
                    return prev;
                  }
                }),
              15
            );
          }
          if (e.evt.x < 20) {
            interval.current = setInterval(
              () =>
                setLayerX((prev) => {
                  if (prev < 0) {
                    return prev + 4;
                  }
                  clearInterval(interval.current!);
                  return prev;
                }),
              15
            );
          }
        }}
        onWheel={(e) => {
          e.evt.preventDefault();
          if (e.evt.ctrlKey) {
            const oldZoom = zoom;
            const pointer = stageRef.current.getPointerPosition();

            const mousePointTo = (pointer.x - layerX) / oldZoom;
            const newScale = Math.min(
              Math.max(
                e.evt.deltaY < 0 ? oldZoom * scaleBy : oldZoom / scaleBy,
                minZoom
              ),
              maxZoom
            );

            setZoom(newScale);
            const newLayerX = pointer.x - mousePointTo * newScale;
            if (newLayerX < 0 && stageWidth < canvasWidth) {
              // only moving to "the right"
              setLayerX(newLayerX);
            }
          } else if (zoom !== minZoom) {
            const dx = e.evt.deltaX;

            const minX = -(canvasWidth - stageWidth);
            const maxX = 0;

            const x = Math.max(minX, Math.min(layerX - dx, maxX));
            setLayerX(x);
          }
        }}
        onClick={(e) => {
          const x = (e.evt.x - layerX) / zoom;
          setPlayheadX({ x, type: 'ref' });

          const change = Object.values(changes).find((c) => {
            if (x >= c.x && x <= c.x + c.width) {
              return true;
            }
            return false;
          });

          if (!change) {
            setSelectedChangeIds([]);
            return;
          }

          const parentId = change.parentChangeId || change.id;

          if (e.evt.shiftKey) {
            setSelectedChangeIds((current) => [...current, parentId]);
          } else {
            setSelectedChangeIds([parentId]);
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
        <PreviewPlayhead
          layerX={layerX}
          zoom={zoom}
          height={stageHeight - 10}
        />

        <Layer>
          <Rect
            ref={scrollbarXRef}
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
