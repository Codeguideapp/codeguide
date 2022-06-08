import { useAtom } from 'jotai';
import { Group, Layer, Rect } from 'react-konva';

import {
  isPlayheadVisibleAtom,
  isPlayingAtom,
  playheadXAtom,
  refPlayheadXAtom,
  setPlayheadXAtom,
} from '../atoms/playhead';

export function Playhead({
  layerX,
  zoom,
  height,
}: {
  layerX: number;
  zoom: number;
  height: number;
}) {
  const [isPlaying] = useAtom(isPlayingAtom);
  const [playHeadX] = useAtom(refPlayheadXAtom);
  const [, setPlayheadX] = useAtom(setPlayheadXAtom);

  return (
    <Layer x={layerX}>
      <Group
        x={playHeadX * zoom}
        y={0}
        draggable
        onDragMove={(event) => {
          const pos = event.target.getPosition();
          setPlayheadX({
            x: pos.x / zoom,
            type: 'ref',
          });
        }}
        dragBoundFunc={(pos) => {
          return {
            x: pos.x < 0 ? 0 : pos.x,
            y: 0,
          };
        }}
      >
        <Rect
          width={1}
          height={height}
          fill={isPlaying ? '#ECFF75' : '#666666'}
        />
        <Rect x={1} width={6} height={height} fill="red" opacity={0} />
      </Group>
    </Layer>
  );
}

export function PreviewPlayhead({
  layerX,
  zoom,
  height,
}: {
  layerX: number;
  zoom: number;
  height: number;
}) {
  const [playheadVisible] = useAtom(isPlayheadVisibleAtom);
  const [playHeadX] = useAtom(playheadXAtom);

  return (
    <Layer x={layerX - 1} opacity={playheadVisible ? 1 : 0}>
      <Group x={playHeadX * zoom} y={0}>
        <Rect width={1} height={height} fill="#9E9E9E" />
      </Group>
    </Layer>
  );
}
