import { faFile } from '@fortawesome/free-regular-svg-icons';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useChangesStore } from '../store/changes';

export function FileIcon({ path }: { path: string }) {
  const draftChanges = useChangesStore((s) =>
    Object.values(s.changes)
      .filter((c) => c.isDraft)
      .map((c) => c.path)
  );

  if (!draftChanges.includes(path)) return <FontAwesomeIcon icon={faFile} />;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-[8px] w-[8px] rounded-full bg-yellow-300" />
    </div>
  );
}
