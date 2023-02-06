import { library } from '@fortawesome/fontawesome-svg-core';
import { faComment } from '@fortawesome/free-solid-svg-icons';

import { useChangesStore } from '../store/changes';
import { StepActions } from './StepActions';
import { WriteComment } from './WriteComment';

library.add(faComment);

export function BottomBarEdit() {
  const activeChangeId = useChangesStore((s) => s.activeChangeId);

  if (!activeChangeId) return null;

  return (
    <div className="step-controls absolute bottom-0 right-0 left-0 z-10  bg-zinc-900">
      <div
        style={{
          padding: 10,
          justifyContent: 'right',
          display: 'flex',
          gap: 10,
        }}
      >
        <div style={{ marginRight: 'auto', flexGrow: 1 }}>
          <WriteComment />
        </div>
        <StepActions />
      </div>
    </div>
  );
}
