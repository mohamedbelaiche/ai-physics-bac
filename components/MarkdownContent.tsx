"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="md-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, output: "html" }]]}
        components={{
          a: ({ node: _node, ...rest }) => (
            <a target="_blank" rel="noopener noreferrer" {...rest} />
          ),
          table: ({ node: _node, ...rest }) => (
            <div className="table-wrap">
              <table {...rest} />
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
