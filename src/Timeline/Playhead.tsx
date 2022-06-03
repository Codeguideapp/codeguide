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
    <Layer x={layerX}>
      <Group
        x={playHeadX * zoom}
        y={0}
        draggable
        onDragMove={(event) => {
          const pos = event.target.getPosition();
          setPlayheadX(pos.x / zoom);
        }}
        dragBoundFunc={(pos) => {
          return {
            x: pos.x < 0 ? 0 : pos.x,
            y: 0,
          };
        }}
      >
        <Rect x={0} width={4} height={height} fill="red" opacity={0} />
        <Rect x={4} width={1} height={height} fill="#9E9E9E" />
        <Rect x={5} width={4} height={height} fill="red" opacity={0} />
      </Group>
    </Layer>
  );
}
