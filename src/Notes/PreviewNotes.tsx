import 'highlight.js/styles/github-dark.css';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

import { notesModel } from './WriteNotes';

export function PreviewNotes() {
  const markdown = notesModel.getValue();

  return (
    <div className="body-preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        children={markdown}
      />
    </div>
  );
}
