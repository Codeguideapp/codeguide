import { library } from '@fortawesome/fontawesome-svg-core';
import { faMessage } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'antd';
import { useAtom } from 'jotai';

import { selectedChangeIdsAtom } from '../atoms/changes';
import { showAddCommentDialogAtom } from '../atoms/layout';

library.add(faMessage);

export function TimelineMenu() {
  const [selectedChangeIds] = useAtom(selectedChangeIdsAtom);
  const [, setAhowAddCommentDialog] = useAtom(showAddCommentDialogAtom);

  return (
    <div className="timeline-menu">
      <Tooltip
        title={
          selectedChangeIds.length
            ? 'Add comment to change(s)'
            : 'Add Comment: No change selected'
        }
        placement="topLeft"
      >
        <FontAwesomeIcon
          icon="message"
          onClick={() => {
            if (selectedChangeIds.length) {
              setAhowAddCommentDialog(true);
            }
          }}
          style={
            selectedChangeIds.length
              ? {
                  opacity: 1,
                  cursor: 'pointer',
                }
              : {
                  opacity: 0.2,
                  cursor: 'not-allowed',
                }
          }
        />
      </Tooltip>
    </div>
  );
}
