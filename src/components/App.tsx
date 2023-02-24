/* eslint-disable @next/next/no-html-link-for-pages */
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faEdit,
  faMagnifyingGlass,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { message } from 'antd';
import classNames from 'classnames';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Split from 'react-split';

import { Editor } from './Editor/Editor';
import { LeftSide } from './LeftSide/LeftSide';
import { PrevNextControls } from './PrevNextControls';
import { ProfileMenu } from './ProfileMenu';
import { isEditing } from './store/atoms';
import { useCommentsStore } from './store/comments';
import { useGuideStore } from './store/guide';
import { useStepsStore } from './store/steps';

export function App() {
  const { data: session } = useSession();
  const guideId = useGuideStore((s) => s.id);
  const guideType = useGuideStore((s) => s.type);
  const prNum = useGuideStore((s) => s.prNum);
  const repository = useGuideStore((s) => s.repository);
  const owner = useGuideStore((s) => s.owner);
  const publishComments = useCommentsStore((s) => s.publishComments);
  const publishChanges = useStepsStore((s) => s.publishSteps);
  const hasUnpublishedChanges = useStepsStore((s) => s.hasDataToPublish());
  const hasUnpublishedComments = useCommentsStore((s) => s.hasDataToPublish());
  const [isDragging, setDragging] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const hasUnpublishedData = hasUnpublishedChanges || hasUnpublishedComments;

  useEffect(() => {
    if (hasUnpublishedData) {
      window.onbeforeunload = function () {
        return true;
      };
    } else {
      window.onbeforeunload = null;
    }

    return () => {
      window.onbeforeunload = null;
    };
  }, [hasUnpublishedData]);

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
      <div className="top-bar flex h-[40px] items-center justify-between gap-2 bg-zinc-800 px-4">
        <div className="flex items-center gap-5">
          <a className="text-xs font-bold hover:text-gray-400" href="/">
            CodeGuide
          </a>
          {repository && (
            <Link
              className="flex items-center gap-1 text-xs hover:text-gray-400"
              href={`https://github.com/${link}`}
              target="_blank"
            >
              <FontAwesomeIcon icon={faGithub} />
              <span>{link}</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditing() ? (
            isSaving ? (
              <span className="cursor-wait px-1 py-2 text-xs text-white">
                publishing...
              </span>
            ) : (
              <div
                onClick={hasUnpublishedData ? handlePublish : undefined}
                className="flex cursor-pointer items-center justify-center gap-1 px-1 py-2 text-xs text-white hover:text-gray-400"
                style={hasUnpublishedData ? {} : { opacity: 0.3 }}
              >
                <FontAwesomeIcon icon={faUpload} className="text-md" />
                <span>Publish guide</span>
              </div>
            )
          ) : null}

          {session ? (
            <>
              {isEditing() ? (
                <>
                  <Link
                    className=" flex items-center justify-center gap-1 px-1 py-2 text-xs text-white hover:text-gray-400"
                    href={`/${guideId}`}
                  >
                    <FontAwesomeIcon
                      icon={faMagnifyingGlass}
                      className="text-md"
                    />
                    <span>Preview guide</span>
                  </Link>
                </>
              ) : (
                <Link
                  className=" flex items-center justify-center gap-1 px-1 py-2 text-xs text-white hover:text-gray-400"
                  href={`/${guideId}/edit`}
                >
                  <FontAwesomeIcon icon={faEdit} className="text-md" />
                  <span>Edit guide</span>
                </Link>
              )}
              <ProfileMenu hasUnpublishedData={hasUnpublishedData} />
            </>
          ) : (
            <span
              onClick={() => signIn('github')}
              className=" flex cursor-pointer items-center justify-center gap-1 px-1 py-2 text-xs text-white hover:text-gray-400"
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
