import React from "react";

export function KeyValue({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="muted" style={{ fontSize: 12, marginBottom: 2 }}>{k}</div>
      <div>{v}</div>
    </div>
  );
}
