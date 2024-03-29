import Link from 'next/link';

import { Guide } from '../../types/Guide';
import { isEditing } from '../store/atoms';
import { useStepsStore } from '../store/steps';

export function Welcome({ guide }: { guide: Guide }) {
  const stepsNum = useStepsStore((s) => Object.keys(s.steps).length);

  return (
    <div className="h-full overflow-auto bg-zinc-900 p-5">
      {stepsNum === 0 && !isEditing() ? (
        <div>
          <p className="mb-2">
            It looks like there aren&apos;t any guide steps saved at the moment
          </p>
          <p>
            If you are the author of the guide, you can add steps in the{' '}
            <Link className="font-bold" href={`${guide.id}/edit`}>
              edit mode
            </Link>
            .
          </p>
        </div>
      ) : null}
      {isEditing() && guide.type === 'browse' && (
        <div>
          <h2 className="py-2 font-bold">Welcome to CodeGuide!</h2>
          <div>
            To start, just open the file and highlight the code you want to
            explain or comment on.
          </div>
        </div>
      )}
      {isEditing() && guide.type === 'diff' && (
        <div>
          <h2 className="mb-2 py-2 font-bold">Welcome to CodeGuide!</h2>
          <div className="mb-2">
            To create a guide, just open the file in the &quot;File
            Changes&quot; section and use a diff viewer to recreate the PR.
          </div>
          <div>
            You can also use &quot;File explorer&quot; for any other file you
            qant to explain or reffer to.
          </div>
        </div>
      )}
    </div>
  );
}
