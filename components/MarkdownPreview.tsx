import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className }) => {
  return (
    <div className={`prose prose-slate max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]} 
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom rendering for specific elements if needed
          code({ node, inline, className, children, ...props }: any) {
            return (
              <code className={`${className} bg-slate-100 rounded px-1 py-0.5 text-sm text-slate-800`} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
