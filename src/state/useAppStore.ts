import { create } from "zustand";
import { loadConfig } from "../config";

const STORAGE_KEY = "rtai_webui_v1";

export type StoredConfig = {
  aiBaseUrl: string;
  localAgentUrl: string;
  defaultTargetsCsv: string;
  policyId: string;
  tenantId: string;
  userId: string;
  agentId: string;
  objective: string;
};

export type AppState = {
  config: StoredConfig;
  sessionId: string;

  setConfig: (patch: Partial<StoredConfig>) => void;
  resetConfigToRuntimeDefaults: () => void;

  setSessionId: (id: string) => void;
  clearSessionId: () => void;
};

function fromRuntimeDefaults(): StoredConfig {
  const c = loadConfig();
  return {
    aiBaseUrl: c.AI_BASE_URL,
    localAgentUrl: c.LOCAL_AGENT_URL,
    defaultTargetsCsv: (c.DEFAULT_TARGETS || []).join(","),
    policyId: c.DEFAULT_POLICY_ID,
    tenantId: c.DEFAULT_TENANT_ID,
    userId: c.DEFAULT_USER_ID,
    agentId: c.DEFAULT_AGENT_ID,
    objective: "Complete the lab objective safely within allowed scope."
  };
}

function loadFromStorage(): { config: StoredConfig; sessionId: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.config) return null;
    return {
      config: parsed.config as StoredConfig,
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : ""
    };
  } catch {
    return null;
  }
}

function persist(state: { config: StoredConfig; sessionId: string }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function parseTargetsCsv(csv: string): string[] {
  return (csv || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

const initial = (() => {
  const saved = loadFromStorage();
  if (saved) return saved;
  return { config: fromRuntimeDefaults(), sessionId: "" };
})();

export const useAppStore = create<AppState>((set, get) => ({
  config: initial.config,
  sessionId: initial.sessionId,

  setConfig: (patch) => {
    const next = { ...get().config, ...patch };
    set({ config: next });
    persist({ config: next, sessionId: get().sessionId });
  },

  resetConfigToRuntimeDefaults: () => {
    const next = fromRuntimeDefaults();
    set({ config: next });
    persist({ config: next, sessionId: get().sessionId });
  },

  setSessionId: (id) => {
    set({ sessionId: id });
    persist({ config: get().config, sessionId: id });
  },

  clearSessionId: () => {
    set({ sessionId: "" });
    persist({ config: get().config, sessionId: "" });
  }
}));
