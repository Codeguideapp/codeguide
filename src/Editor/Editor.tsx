import { FastForwardFilled } from '@ant-design/icons';
import { Button } from 'antd';
import { useAtom } from 'jotai';

import { highlightToEditButtonAtom } from '../atoms/layout';
import { canEditAtom, setPlayheadXAtom } from '../atoms/playhead';
import { Comments } from '../Comments/Comments';
import { EditorEditMode } from './EditorEditMode';
import { EditorReadMode } from './EditorReadMode';

export function Editor() {
  const [canEdit] = useAtom(canEditAtom);
  const [highlightToEdit] = useAtom(highlightToEditButtonAtom);
  const [, setPlayheadX] = useAtom(setPlayheadXAtom);

  return (
    <div className="main-right">
      <div className="editor-top">
        {!canEdit && (
          <Button
            className="bact-to-edit-button"
            type="link"
            style={highlightToEdit ? { color: 'white' } : {}}
            onClick={() => setPlayheadX({ x: Infinity, type: 'ref' })}
          >
            Return to Edit Mode
            <FastForwardFilled />
          </Button>
        )}
      </div>
      <div className="editor-bottom">
        {canEdit ? <EditorEditMode /> : <EditorReadMode />}
      </div>
      <Comments />
    </div>
  );
}
