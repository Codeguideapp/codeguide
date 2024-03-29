/* eslint-disable @next/next/no-html-link-for-pages */
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faEdit,
  faMagnifyingGlass,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { message, Tooltip } from 'antd';
import classNames from 'classnames';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Moment from 'react-moment';
import Split from 'react-split';

import { Guide } from '../types/Guide';
import { api } from '../utils/api';
import { Editor } from './Editor/Editor';
import { LeftSide } from './LeftSide/LeftSide';
import { PrevNextControls } from './PrevNextControls';
import { ProfileMenu } from './ProfileMenu';
import { isEditing } from './store/atoms';
import { useCommentsStore } from './store/comments';
import { useFilesStore } from './store/files';
import { useStepsStore } from './store/steps';

export function App({ guide }: { guide: Guide }) {
  const { data: session } = useSession();
  const publishGuideMutation = api.publishGuide.useMutation();
  const getUnpublishedComments = useCommentsStore((s) => s.getUnpublishedData);
  const virtualFiles = useFilesStore((s) =>
    s.fileNodes.filter((f) => f.origin === 'virtual')
  );
  const getUnpublishedSteps = useStepsStore((s) => s.getUnpublishedData);
  const hasUnpublishedChanges = useStepsStore((s) => s.hasDataToPublish());
  const hasUnpublishedComments = useCommentsStore((s) => s.hasDataToPublish());
  const [isDragging, setDragging] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const hasUnpublishedData = hasUnpublishedChanges || hasUnpublishedComments;

  useEffect(() => {
    if (publishGuideMutation.data) {
      useStepsStore.setState({
        publishedStepIds: [
          ...useStepsStore
            .getState()
            .publishedStepIds.filter(
              (id) => !publishGuideMutation.data.steps.deletedIds.includes(id)
            ),
          ...publishGuideMutation.data.steps.savedIds,
        ],
      });

      useCommentsStore.setState({
        publishedCommentIds: [
          ...useCommentsStore
            .getState()
            .publishedCommentIds.filter(
              (id) =>
                !publishGuideMutation.data.comments.deletedIds.includes(id)
            ),
          ...publishGuideMutation.data.comments.savedIds,
        ],
      });

      message.success({
        content: 'Guide published successfully!',
      });

      setSaving(false);
    }
  }, [publishGuideMutation.data]);

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

  const handlePublish = () => {
    setSaving(true);
    const unpublishedSteps = getUnpublishedSteps();
    const unpublishedComments = getUnpublishedComments();

    publishGuideMutation.mutate({
      guideId: guide.id,
      deleteSteps: unpublishedSteps.stepIdsToDelete,
      saveSteps: unpublishedSteps.stepsToPublish,
      saveComments: unpublishedComments.commentsToPublish,
      deleteCommentIds: unpublishedComments.commentIdsToDelete,
      guideFiles: virtualFiles.map((file) => ({ path: file.path })),
    });
  };

  const link =
    guide.type === 'diff'
      ? `${guide.owner}/${guide.repository}/pull/${guide.prNum}`
      : `${guide.owner}/${guide.repository}`;

  return (
    <div>
      <div className="top-bar flex h-[40px] items-center justify-between gap-2 bg-zinc-800 px-4">
        <div className="flex items-center gap-5">
          <a className="text-xs font-bold hover:text-gray-400" href="/">
            CodeGuide
          </a>
          {guide.repository && (
            <Link
              className="flex items-center gap-1 text-xs hover:text-gray-400"
              href={`https://github.com/${link}`}
              target="_blank"
            >
              <FontAwesomeIcon icon={faGithub} />
              <span>{link}</span>
            </Link>
          )}
          <Tooltip title={String(new Date(guide.createdAt))}>
            <span className="cursor-default text-xs">
              Created <Moment fromNow>{guide.createdAt}</Moment>
            </span>
          </Tooltip>
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
                <span>Publish</span>
              </div>
            )
          ) : null}

          {session ? (
            <>
              {isEditing() ? (
                <>
                  <Link
                    className=" flex items-center justify-center gap-1 px-1 py-2 text-xs text-white hover:text-gray-400"
                    href={`/${guide.id}`}
                  >
                    <FontAwesomeIcon
                      icon={faMagnifyingGlass}
                      className="text-md"
                    />
                    <span>Preview</span>
                  </Link>
                </>
              ) : (
                <Link
                  className=" flex items-center justify-center gap-1 px-1 py-2 text-xs text-white hover:text-gray-400"
                  href={`/${guide.id}/edit`}
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
          <LeftSide guide={guide} />
          <Editor guide={guide} />
        </Split>
      </div>
      <PrevNextControls />
    </div>
  );
}
