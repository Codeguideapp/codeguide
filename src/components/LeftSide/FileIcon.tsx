import { faFile } from '@fortawesome/free-regular-svg-icons';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useStepsStore } from '../store/steps';

export function FileIcon({ path }: { path: string }) {
  const draftChanges = useStepsStore((s) =>
    Object.values(s.steps)
      .filter((c) => c.isDraft)
      .map((c) => c.path)
  );

  if (!draftChanges.includes(path))
    return <FontAwesomeIcon icon={faFile} fontSize={12} />;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-[8px] w-[8px] rounded-full bg-yellow-300" />
    </div>
  );
}
