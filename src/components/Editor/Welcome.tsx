import Link from 'next/link';

import { isEditing } from '../store/atoms';
import { useChangesStore } from '../store/changes';
import { useGuideStore } from '../store/guide';

export function Welcome() {
  const guideId = useGuideStore((s) => s.id);
  const stepsNum = useChangesStore((s) => Object.keys(s.changes).length);

  return (
    <div className="h-full overflow-auto bg-zinc-900 p-5">
      {stepsNum === 0 && !isEditing() ? (
        <div>
          <p className="mb-2">
            It looks like there aren&apos;t any guide steps saved at the moment
          </p>
          <p>
            If you are the author of the guide, you can add steps in the{' '}
            <Link className="font-bold" href={`${guideId}/edit`}>
              edit mode
            </Link>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}
