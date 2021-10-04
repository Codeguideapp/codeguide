import { useCallback } from 'react';
import { Rect, Layer, Group } from 'react-konva';
import { useStore } from '../store';

export function Playhead({
  layerX,
  zoom,
  height,
}: {
  layerX: number;
  zoom: number;
  height: number;
}) {
  const playHeadX = useStore(useCallback((state) => state.playHeadX, []));
  const setPlayHeadX = useStore(useCallback((state) => state.setPlayHeadX, []));

  return (
    <Layer x={layerX} scaleX={zoom}>
      <Group
        x={playHeadX}
        y={0}
        draggable
        onDragMove={(event) => {
          const pos = event.target.getPosition();
          setPlayHeadX(pos.x);
        }}
        dragBoundFunc={(pos) => {
          return {
            x: pos.x,
            y: 0,
          };
        }}
      >
        <Rect x={0} width={2} height={height} stroke="black" opacity={0} />
        <Rect x={2} width={1} height={height} stroke="black" />
        <Rect x={3} width={2} height={height} stroke="black" opacity={0} />
      </Group>
    </Layer>
  );
}
