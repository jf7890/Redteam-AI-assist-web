export type AppConfig = {
  AI_BASE_URL: string;
  LOCAL_AGENT_URL: string;
  DEFAULT_TARGETS: string[];
  DEFAULT_POLICY_ID: string;
  DEFAULT_TENANT_ID: string;
  DEFAULT_USER_ID: string;
  DEFAULT_AGENT_ID: string;
};

function splitCsv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function loadConfig(): AppConfig {
  const w = window.__APP_CONFIG__ ?? {};
  const AI_BASE_URL =
    (w.AI_BASE_URL && w.AI_BASE_URL !== "$AI_BASE_URL" ? w.AI_BASE_URL : undefined) ||
    import.meta.env.VITE_AI_BASE_URL ||
    "http://127.0.0.1:8088";

  const LOCAL_AGENT_URL =
    (w.LOCAL_AGENT_URL && w.LOCAL_AGENT_URL !== "$LOCAL_AGENT_URL" ? w.LOCAL_AGENT_URL : undefined) ||
    import.meta.env.VITE_LOCAL_AGENT_URL ||
    "http://127.0.0.1:8787";

  const DEFAULT_TARGETS = splitCsv(
    (w.DEFAULT_TARGETS && w.DEFAULT_TARGETS !== "$DEFAULT_TARGETS" ? w.DEFAULT_TARGETS : undefined) ||
      import.meta.env.VITE_DEFAULT_TARGETS ||
      ""
  );

  const DEFAULT_POLICY_ID =
    (w.DEFAULT_POLICY_ID && w.DEFAULT_POLICY_ID !== "$DEFAULT_POLICY_ID" ? w.DEFAULT_POLICY_ID : undefined) ||
    import.meta.env.VITE_DEFAULT_POLICY_ID ||
    "lab-default";

  const DEFAULT_TENANT_ID =
    (w.DEFAULT_TENANT_ID && w.DEFAULT_TENANT_ID !== "$DEFAULT_TENANT_ID" ? w.DEFAULT_TENANT_ID : undefined) ||
    import.meta.env.VITE_DEFAULT_TENANT_ID ||
    "lab";

  const DEFAULT_USER_ID =
    (w.DEFAULT_USER_ID && w.DEFAULT_USER_ID !== "$DEFAULT_USER_ID" ? w.DEFAULT_USER_ID : undefined) ||
    import.meta.env.VITE_DEFAULT_USER_ID ||
    "student";

  const DEFAULT_AGENT_ID =
    (w.DEFAULT_AGENT_ID && w.DEFAULT_AGENT_ID !== "$DEFAULT_AGENT_ID" ? w.DEFAULT_AGENT_ID : undefined) ||
    import.meta.env.VITE_DEFAULT_AGENT_ID ||
    "redteam-ai-assist";

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
