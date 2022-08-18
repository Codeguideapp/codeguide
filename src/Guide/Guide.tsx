import { useAtom } from 'jotai';

import {
  activeChangeIdAtom,
  canEditAtom,
  changesAtom,
  changesOrderAtom,
} from '../atoms/changes';
import { undraftChangeAtom } from '../atoms/saveDeltaAtom';

export function Guide() {
  const [changes] = useAtom(changesAtom);
  const [changesOrder] = useAtom(changesOrderAtom);
  const [activeChangeId, setActiveChangeId] = useAtom(activeChangeIdAtom);
  const [, setCanEdit] = useAtom(canEditAtom);
  const [, undraftChange] = useAtom(undraftChangeAtom);

  const nonDepChanges = changesOrder
    .filter((id) => !changes[id].isFileDepChange)
    .map((id) => changes[id]);

  return (
    <div className="guide">
      {nonDepChanges.map((change, index) => {
        return (
          <div
            key={change.id}
            onClick={() => {
              if (change.id === activeChangeId) {
                setActiveChangeId(null);
                setCanEdit(true);
              } else {
                setCanEdit(false);
                setActiveChangeId(change.id);
              }
            }}
            style={{
              position: 'relative',
              fontWeight: activeChangeId === change.id ? 'bold' : 'normal',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  background: '#5F5F5F',
                  width: 19,
                  height: 19,
                  borderRadius: 19,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* <FontAwesomeIcon
                  color="black"
                  icon="check"
                  style={{ fontSize: 10 }}
                /> */}
                <span
                  style={{
                    fontSize: 11,
                    color: '#000',
                    fontWeight: 'bold',
                    fontFamily: 'Inconsolata',
                  }}
                >
                  {index + 1}
                </span>
              </div>
              <div style={{ width: 10, height: 1, background: '#666' }}></div>
              {change.isFileNode ? (
                <div>open "{change.path.split('/').pop()}"</div>
              ) : (
                <div
                  style={{
                    width: 'calc(100% - 50px)',
                    height: 35,
                    borderRadius: 2,
                    background: change.isFileNode ? 'red' : 'rgb(52 52 52)',
                  }}
                >
                  {change.isDraft && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        undraftChange(change.id);
                      }}
                    >
                      save
                    </button>
                  )}
                </div>
              )}
            </div>
            {index !== 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: -1,
                  height: 'calc(50% - 8px)',
                  width: 1,
                  background: '#666',
                  left: 9,
                }}
              ></div>
            )}
            {index !== nonDepChanges.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(50% + 9px)',
                  height: '50%',
                  width: 1,
                  background: '#666',
                  left: 9,
                }}
              ></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
