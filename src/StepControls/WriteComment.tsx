import TextArea from 'antd/lib/input/TextArea';
import { useAtom } from 'jotai';
import { useMemo } from 'react';

import {
  activeChangeIdAtom,
  highlightChangeIdAtom,
  highlightChangeIndexAtom,
} from '../atoms/changes';
import { draftCommentsAtom, saveActiveNoteValAtom } from '../atoms/comments';

export function WriteComment() {
  const [highlightChangeId] = useAtom(highlightChangeIdAtom);
  const [draftComments] = useAtom(draftCommentsAtom);
  const [highlightChangeIndex] = useAtom(highlightChangeIndexAtom);
  const [, saveActiveNoteVal] = useAtom(saveActiveNoteValAtom);
  const [activeChangeId] = useAtom(activeChangeIdAtom);

  const value = useMemo(() => {
    const changeId = highlightChangeId || activeChangeId;
    return changeId ? draftComments[changeId] || '' : '';
  }, [highlightChangeId, activeChangeId, draftComments]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    saveActiveNoteVal(e.target.value);
  };

  return (
    <TextArea
      autoSize={{
        maxRows: 5,
      }}
      style={{ borderRadius: 4, borderColor: '#303338' }}
      disabled={!activeChangeId}
      rows={1}
      onChange={handleChange}
      value={value}
      placeholder={`Write a note/explanation for step ${
        highlightChangeIndex || 0 + 1
      } (optional)`}
    />
  );
}
