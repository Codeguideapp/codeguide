import { Avatar, Comment } from 'antd';
import ReactMarkdown from 'react-markdown';
import Moment from 'react-moment';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import useSWRImmutable from 'swr/immutable';

import type { IComment } from '../store/comments';
import { useUserStore } from '../store/user';

export function PreviewComment({ comment }: { comment: IComment }) {
  const getOctokit = useUserStore((s) => s.getOctokit);
  const author = useSWRImmutable(
    comment.githubUserId
      ? `https://api.github.com/user/${comment.githubUserId}`
      : undefined,
    (url) => getOctokit().then((octokit) => octokit.request(url))
  );

  const name = author.data?.data?.name || '';

  return (
    <Comment
      author={name}
      avatar={
        <Avatar
          src={
            comment.githubUserId
              ? `https://avatars.githubusercontent.com/u/${comment.githubUserId}?v=4`
              : undefined
          }
          alt={name}
        />
      }
      content={
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {comment.commentBody}
        </ReactMarkdown>
      }
      datetime={<Moment fromNow date={new Date(comment.timestamp)} />}
    />
  );
}
