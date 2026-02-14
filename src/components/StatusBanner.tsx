import React from "react";

export type StatusKind = "idle" | "ok" | "error";

export function StatusBanner({
  title,
  kind,
  message
}: {
  title: string;
  kind: StatusKind;
  message?: string;
}) {
  if (kind === "idle") return null;

  if (kind === "ok") {
    return (
      <div className="ok">
        <b>{title}:</b> {message || "OK"}
      </div>
    );
  }

  return (
    <div className="error">
      <b>{title}:</b> {message || "Error"}
    </div>
  );
}
