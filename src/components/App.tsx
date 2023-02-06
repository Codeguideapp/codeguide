import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faEarthAmericas, faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { message } from 'antd';
import classNames from 'classnames';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';
import Split from 'react-split';

import { Editor } from './Editor/Editor';
import { LeftSide } from './LeftSide/LeftSide';
import { PrevNextControls } from './PrevNextControls';
import { ProfileMenu } from './ProfileMenu';
import { isEditing } from './store/atoms';
import { useChangesStore } from './store/changes';
import { useCommentsStore } from './store/comments';
import { useGuideStore } from './store/guide';

export function App() {
  const { data: session } = useSession();
  const guideId = useGuideStore((s) => s.id);
  const guideType = useGuideStore((s) => s.type);
  const prNum = useGuideStore((s) => s.prNum);
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

  const link =
    guideType === 'diff'
      ? `${owner}/${repository}/pull/${prNum}`
      : `${owner}/${repository}`;

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link className="text-xs font-bold hover:text-gray-400" href="/">
            CodeGuide
          </Link>
          <Link
            className="flex items-center gap-1 text-xs hover:text-gray-400"
            href={`https://github.com/${link}`}
            target="_blank"
          >
            <FontAwesomeIcon icon={faGithub} />
            <span>{link}</span>
          </Link>
        </div>

        <div className="action flex gap-2">
          {session ? (
            <>
              {isEditing() ? (
                <>
                  {isSaving ? (
                    <span>publishing...</span>
                  ) : (
                    <div
                      onClick={shouldPublish ? handlePublish : undefined}
                      className="font-small flex cursor-pointer items-center justify-center gap-1 px-3 py-2 text-xs text-white hover:text-gray-400"
                      style={shouldPublish ? {} : { opacity: 0.3 }}
                    >
                      <FontAwesomeIcon
                        icon={faEarthAmericas}
                        className="text-md"
                      />
                      <span>Publish guide</span>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  className="font-small flex items-center justify-center gap-1 px-3 py-2 text-xs text-white hover:text-gray-400"
                  href={`/${guideId}/edit`}
                >
                  <FontAwesomeIcon icon={faEdit} className="text-md" />
                  <span>Edit guide</span>
                </Link>
              )}
              <ProfileMenu />
            </>
          ) : (
            <span
              onClick={() => signIn('github')}
              className="font-small flex cursor-pointer items-center justify-center gap-1 px-3 py-2 text-xs text-white hover:text-gray-400"
            >
              <FontAwesomeIcon icon={faGithub} className="text-md" />
              <span>Log in</span>
            </span>
          )}
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
