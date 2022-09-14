import 'highlight.js/styles/github-dark.css';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

export function PreviewNotes({ value }: { value: string }) {
  return (
    <div className="body-preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        children={value}
      />
    </div>
  );
}
