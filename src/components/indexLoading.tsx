import { LoadingIcon } from './svgIcons/LoadingIcon';

export function Loading() {
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-zinc-900">
      <div role="status">
        <LoadingIcon />
      </div>
    </div>
  );
}
