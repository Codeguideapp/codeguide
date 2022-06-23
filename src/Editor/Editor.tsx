import { useAtom } from 'jotai';

//import { activeFileAtom } from '../atoms/files';
import { canEditAtom } from '../atoms/playhead';
import { Comments } from '../Comments/Comments';
import { EditorEditMode } from './EditorEditMode';
import { EditorReadMode } from './EditorReadMode';

export function Editor() {
  const [canEdit] = useAtom(canEditAtom);
  //const [activeFile] = useAtom(activeFileAtom);
  //const path = activeFile?.path || '';

  return (
    <div className="main-right">
      <div className="editor-top"></div>
      <div className="editor-bottom">
        {canEdit ? <EditorEditMode /> : <EditorReadMode />}
      </div>
      <Comments />
    </div>
  );
}
