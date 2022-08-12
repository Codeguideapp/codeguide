import { useAtom } from 'jotai';
import { last } from 'lodash';

import {
  activeChangeIdAtom,
  changesAtom,
  changesOrderAtom,
} from '../atoms/changes';
import { canEditAtom } from '../atoms/playhead';

export function Guide() {
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [activeChangeId, setActiveChangeId] = useAtom(activeChangeIdAtom);
  const [canEdit, setCanEdit] = useAtom(canEditAtom);

  return (
    <div className="guide">
      {changesOrder
        .filter((id) => !changes[id].isFileDepChange)
        .map((id) => {
          const change = changes[id];
          return (
            <div
              key={change.id}
              onClick={() => {
                if (id === activeChangeId) {
                  setActiveChangeId(null);
                  setCanEdit(true);
                } else {
                  setCanEdit(false);
                  setActiveChangeId(id);
                }
              }}
              style={{
                fontWeight: activeChangeId === id ? 'bold' : 'normal',
              }}
            >
              {change.id}
            </div>
          );
        })}
    </div>
  );
}
