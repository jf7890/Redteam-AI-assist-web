import React from "react";

export function JsonPanel({ value }: { value: any }) {
  return (
    <pre className="mono">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
