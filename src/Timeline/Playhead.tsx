import { useAtom } from 'jotai';
import { Group, Layer, Rect } from 'react-konva';

import { playheadXAtom, setPlayheadXAtom } from '../atoms/playhead';

export function Playhead({
  layerX,
  zoom,
  height,
}: {
  layerX: number;
  zoom: number;
  height: number;
}) {
  const [playHeadX] = useAtom(playheadXAtom);
  const [, setPlayheadX] = useAtom(setPlayheadXAtom);

  return (
    <Layer x={layerX} scaleX={zoom}>
      <Group
        x={playHeadX}
        y={0}
        draggable
        onDragMove={(event) => {
          const pos = event.target.getPosition();
          setPlayheadX(pos.x);
        }}
        dragBoundFunc={(pos) => {
          return {
            x: pos.x < 0 ? 0 : pos.x,
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
