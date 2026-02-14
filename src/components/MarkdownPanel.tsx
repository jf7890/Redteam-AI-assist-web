import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownPanel({ title, markdown }: { title: string; markdown: string }) {
  return (
    <div className="panel">
      <div className="panelHeader">
        <div className="panelTitle">{title}</div>
      </div>
      <div className="markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}
