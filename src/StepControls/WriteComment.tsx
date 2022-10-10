import { Comment, Form } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { useAtom } from 'jotai';
import { useMemo } from 'react';

import {
  activeChangeIdAtom,
  highlightChangeIdAtom,
  highlightChangeIndexAtom,
} from '../atoms/changes';
import { draftCommentsAtom, saveActiveNoteValAtom } from '../atoms/notes';
import { StepActions } from './StepActions';

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
    <Comment
      content={
        <>
          {!highlightChangeId && (
            <Form.Item>
              <TextArea
                disabled={!activeChangeId}
                rows={3}
                onChange={handleChange}
                value={value}
                placeholder={`Write a note/explanation for step ${
                  highlightChangeIndex || 0 + 1
                } (optional)`}
              />
            </Form.Item>
          )}
          <Form.Item>
            <StepActions />
          </Form.Item>
        </>
      }
    />
  );
}
