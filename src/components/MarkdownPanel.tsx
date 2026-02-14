import React from "react";
import ReactMarkdown from "react-markdown";

export function MarkdownPanel({ content }: { content: string }) {
  return (
    <div style={{ lineHeight: 1.5 }}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
