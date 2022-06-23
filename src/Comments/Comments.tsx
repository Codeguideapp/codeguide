import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faInfoCircle,
  faQuestionCircle,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAtomValue } from 'jotai';

import { activeChangeIdAtom, changesAtom } from '../atoms/changes';

library.add(faInfoCircle, faTriangleExclamation, faQuestionCircle);

export function Comments() {
  const activeChangeId = useAtomValue(activeChangeIdAtom);
  const changes = useAtomValue(changesAtom);

  if (!activeChangeId || !changes[activeChangeId].text) return null;

  return (
    <div className="subtitle">
      <div className="icon">
        {changes[activeChangeId].textType === 'info' && (
          <FontAwesomeIcon icon="info-circle" color="#1890ff" />
        )}
        {changes[activeChangeId].textType === 'warn' && (
          <FontAwesomeIcon icon="triangle-exclamation" color="#ff7e00" />
        )}
        {changes[activeChangeId].textType === 'question' && (
          <FontAwesomeIcon icon="question-circle" color="#a600ff" />
        )}
      </div>
      <div className="text">{changes[activeChangeId].text}</div>
    </div>
  );
}
