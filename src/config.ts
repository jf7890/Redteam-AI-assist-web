export type AppConfig = {
  AI_BASE_URL: string;
  LOCAL_AGENT_URL: string;
  DEFAULT_TARGETS: string[];
  DEFAULT_POLICY_ID: string;
  DEFAULT_TENANT_ID: string;
  DEFAULT_USER_ID: string;
  DEFAULT_AGENT_ID: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<Record<string, string>>;
  }
}

function splitCsv(s?: string): string[] {
  return (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function firstNonEmpty(...vals: Array<string | undefined | null>): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

/**
 * Loads config from:
 * 1) window.__APP_CONFIG__ (runtime / Docker)
 * 2) import.meta.env.VITE_* (local dev)
 * 3) safe defaults
 */
export function loadConfig(): AppConfig {
  const w = window.__APP_CONFIG__ ?? {};

  const AI_BASE_URL =
    firstNonEmpty(w.AI_BASE_URL, import.meta.env.VITE_AI_BASE_URL) ?? "http://127.0.0.1:8088";

  const LOCAL_AGENT_URL =
    firstNonEmpty(w.LOCAL_AGENT_URL, import.meta.env.VITE_LOCAL_AGENT_URL) ?? "http://127.0.0.1:8787";

  const DEFAULT_TARGETS = splitCsv(firstNonEmpty(w.DEFAULT_TARGETS, import.meta.env.VITE_DEFAULT_TARGETS) ?? "");

  const DEFAULT_POLICY_ID =
    firstNonEmpty(w.DEFAULT_POLICY_ID, import.meta.env.VITE_DEFAULT_POLICY_ID) ?? "lab-default";

  const DEFAULT_TENANT_ID =
    firstNonEmpty(w.DEFAULT_TENANT_ID, import.meta.env.VITE_DEFAULT_TENANT_ID) ?? "lab";

  const DEFAULT_USER_ID =
    firstNonEmpty(w.DEFAULT_USER_ID, import.meta.env.VITE_DEFAULT_USER_ID) ?? "student";

  const DEFAULT_AGENT_ID =
    firstNonEmpty(w.DEFAULT_AGENT_ID, import.meta.env.VITE_DEFAULT_AGENT_ID) ?? "redteam-ai-assist";

  return {
    AI_BASE_URL,
    LOCAL_AGENT_URL,
    DEFAULT_TARGETS,
    DEFAULT_POLICY_ID,
    DEFAULT_TENANT_ID,
    DEFAULT_USER_ID,
    DEFAULT_AGENT_ID
  };
}

/**
 * Small helper for UI mixed-content warnings:
 * - If UI is served via HTTPS but Local Agent is HTTP, the browser may block requests.
 */
export function isLikelyMixedContent(agentUrl: string): boolean {
  try {
    const u = new URL(agentUrl);
    return window.location.protocol === "https:" && u.protocol === "http:";
  } catch {
    return false;
  }
}
