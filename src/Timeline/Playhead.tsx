import { Rect, Layer } from 'react-konva';

export function Playhead() {
  return (
    <Layer>
      <Rect x={220} y={0} width={2} height={285} stroke="black" />
    </Layer>
  );
}
