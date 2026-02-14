import { useMemo } from "react";

export function JsonPanel({ title, data }: { title: string; data: any }) {
  const text = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      // noop; keep UI simple
    } catch {
      // ignore
    }
  }

  return (
    <div className="panel">
      <div className="panelHeader">
        <div className="panelTitle">{title}</div>
        <button className="btn btn-sm" onClick={copy}>
          Copy
        </button>
      </div>
      <pre className="codeBlock">{text}</pre>
    </div>
  );
}
