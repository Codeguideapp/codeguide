import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { message } from 'antd';
import classNames from 'classnames';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import Split from 'react-split';

import { Editor } from './Editor/Editor';
import { LeftSide } from './LeftSide/LeftSide';
import { PrevNextControls } from './PrevNextControls';
import { isEditing } from './store/atoms';
import { useChangesStore } from './store/changes';
import { useCommentsStore } from './store/comments';
import { useGuideStore } from './store/guide';

export function App() {
  const guideId = useGuideStore((s) => s.id);
  const repository = useGuideStore((s) => s.repository);
  const owner = useGuideStore((s) => s.owner);
  const publishComments = useCommentsStore((s) => s.publishComments);
  const publishChanges = useChangesStore((s) => s.publishChanges);
  const hasUnpublishedChanges = useChangesStore((s) => s.hasDataToPublish());
  const hasUnpublishedComments = useCommentsStore((s) => s.hasDataToPublish());
  const [isDragging, setDragging] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const shouldPublish = hasUnpublishedChanges || hasUnpublishedComments;

  const handlePublish = async () => {
    setSaving(true);
    const changesRes = await publishChanges();
    const commentsRes = await publishComments();
    setSaving(false);

    if (changesRes.success && commentsRes.success) {
      message.success({
        content: 'Guide published successfully!',
      });
    }
  };

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontWeight: 'bold', fontSize: 12 }}>CodeGuide</span>
          <div className="action">
            <FontAwesomeIcon icon={faGithub} />
            <span>
              {owner}/{repository}#122
            </span>
          </div>
        </div>

        <div className="action flex gap-2">
          {isEditing() &&
            (isSaving ? (
              <span>saving...</span>
            ) : (
              <div
                onClick={shouldPublish ? handlePublish : undefined}
                className={shouldPublish ? '' : 'opacity-30'}
              >
                <FontAwesomeIcon icon={faSave} />
                <span>Save</span>
              </div>
            ))}

          {isEditing() ? (
            <Link href={`/${guideId}`}>preview</Link>
          ) : (
            <Link href={`/${guideId}/edit`}>edit</Link>
          )}

          <span onClick={() => signOut()}>logout</span>
        </div>
      </div>
      <div className="fixed top-[40px] bottom-0 left-0 right-0">
        <Split
          className={classNames({ 'split-horiz': true, dragging: isDragging })}
          direction="horizontal"
          sizes={[20, 80]}
          minSize={[200, 300]}
          gutterSize={5}
          onDragStart={() => setDragging(true)}
          onDragEnd={() => setDragging(false)}
        >
          <LeftSide />
          <Editor />
        </Split>
      </div>
      <PrevNextControls />
    </div>
  );
}
