import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session } from "../api/types";
import { loadConfig } from "../config";

export type HealthStatus = "unknown" | "ok" | "error";

export type AppConfigState = {
  aiBaseUrl: string;
  localAgentUrl: string;

  // Stored as CSV string for easy editing in inputs
  defaultTargetsCsv: string;

  policyId: string;
  tenantId: string;
  userId: string;
  agentId: string;
};

export type LocalNote = {
  id: string;
  timestamp: string; // ISO
  text: string;
};

type StoreState = {
  config: AppConfigState;

  // Session
  sessionId: string;
  session?: Session;
  sessionError?: string;

  // Suggest
  lastSuggest?: any;
  lastSuggestAt?: string;
  suggestError?: string;

  // Agent runs
  lastAgentResult?: any;
  lastAgentAt?: string;
  agentError?: string;

  // Notes entered from UI (local convenience)
  localNotes: LocalNote[];

  // Live health checks (not persisted)
  aiHealth: { status: HealthStatus; message?: string; checkedAt?: string };
  agentHealth: { status: HealthStatus; message?: string; checkedAt?: string };

  // Actions
  setConfig: (patch: Partial<AppConfigState>) => void;
  resetConfigToRuntime: () => void;

  setSessionId: (id: string) => void;
  setSession: (session?: Session) => void;
  setSessionError: (msg?: string) => void;

  setLastSuggest: (data?: any) => void;
  setSuggestError: (msg?: string) => void;

  setLastAgentResult: (data?: any) => void;
  setAgentError: (msg?: string) => void;

  addLocalNote: (text: string) => LocalNote;
  clearLocalNotes: () => void;

  setAiHealth: (s: { status: HealthStatus; message?: string }) => void;
  setAgentHealth: (s: { status: HealthStatus; message?: string }) => void;
};

function runtimeDefaults(): AppConfigState {
  const c = loadConfig();
  return {
    aiBaseUrl: c.AI_BASE_URL,
    localAgentUrl: c.LOCAL_AGENT_URL,
    defaultTargetsCsv: (c.DEFAULT_TARGETS || []).join(","),
    policyId: c.DEFAULT_POLICY_ID,
    tenantId: c.DEFAULT_TENANT_ID,
    userId: c.DEFAULT_USER_ID,
    agentId: c.DEFAULT_AGENT_ID
  };
}

export const useAppStore = create<StoreState>()(
  persist(
    (set, get) => ({
      config: runtimeDefaults(),

      sessionId: "",
      session: undefined,
      sessionError: undefined,

      lastSuggest: undefined,
      lastSuggestAt: undefined,
      suggestError: undefined,

      lastAgentResult: undefined,
      lastAgentAt: undefined,
      agentError: undefined,

      localNotes: [],

      aiHealth: { status: "unknown" },
      agentHealth: { status: "unknown" },

      setConfig: (patch) =>
        set((st) => ({
          config: { ...st.config, ...patch }
        })),

      resetConfigToRuntime: () => set({ config: runtimeDefaults() }),

      setSessionId: (id) => set({ sessionId: id.trim() }),

      setSession: (session) => set({ session }),

      setSessionError: (msg) => set({ sessionError: msg }),

      setLastSuggest: (data) =>
        set({
          lastSuggest: data,
          lastSuggestAt: data ? new Date().toISOString() : undefined
        }),

      setSuggestError: (msg) => set({ suggestError: msg }),

      setLastAgentResult: (data) =>
        set({
          lastAgentResult: data,
          lastAgentAt: data ? new Date().toISOString() : undefined
        }),

      setAgentError: (msg) => set({ agentError: msg }),

      addLocalNote: (text) => {
        const note: LocalNote = {
          id: crypto?.randomUUID?.() ?? `note_${Math.random().toString(16).slice(2)}`,
          timestamp: new Date().toISOString(),
          text: text.trim()
        };
        set((st) => ({ localNotes: [note, ...st.localNotes] }));
        return note;
      },

      clearLocalNotes: () => set({ localNotes: [] }),

      setAiHealth: (s) =>
        set({
          aiHealth: { ...s, checkedAt: new Date().toISOString() }
        }),

      setAgentHealth: (s) =>
        set({
          agentHealth: { ...s, checkedAt: new Date().toISOString() }
        })
    }),
    {
      name: "rtaiassist_webui",
      version: 1,
      partialize: (st) => ({
        config: st.config,
        sessionId: st.sessionId,
        localNotes: st.localNotes
      })
    }
  )
);

export function parseTargetsCsv(csv: string): string[] {
  return csv
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
