import { httpJson, httpVoid } from "./http";
import type {
  EventIngestRequest,
  SessionRecord,
  SessionStartRequest,
  SessionSummary,
  SuggestRequest,
  SuggestResponse
} from "./types";

export function makeAiClient(baseUrl: string) {
  const b = baseUrl.replace(/\/+$/, "");

  return {
    health: () => httpJson<{ status: string; app_env?: string }>(`${b}/health`, { method: "GET" }),

    createSession: (body: SessionStartRequest) =>
      httpJson<SessionRecord>(`${b}/v1/sessions`, {
        method: "POST",
        body: JSON.stringify(body)
      }),

    getSession: (sessionId: string) =>
      httpJson<SessionRecord>(`${b}/v1/sessions/${encodeURIComponent(sessionId)}`, { method: "GET" }),

    listSessions: (tenantId?: string, userId?: string, limit = 100) => {
      const params = new URLSearchParams();
      if (tenantId) params.set("tenant_id", tenantId);
      if (userId) params.set("user_id", userId);
      params.set("limit", String(limit));
      return httpJson<SessionSummary[]>(`${b}/v1/sessions?${params.toString()}`, { method: "GET" });
    },

    deleteSession: async (sessionId: string) => {
      await httpVoid(`${b}/v1/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
    },

    ingestEvents: (sessionId: string, body: EventIngestRequest) =>
      httpJson<SessionRecord>(`${b}/v1/sessions/${encodeURIComponent(sessionId)}/events`, {
        method: "POST",
        body: JSON.stringify(body)
      }),

    suggest: (sessionId: string, body: SuggestRequest) =>
      httpJson<SuggestResponse>(`${b}/v1/sessions/${encodeURIComponent(sessionId)}/suggest`, {
        method: "POST",
        body: JSON.stringify(body),
        timeoutMs: 45000
      }),

    kaliAgentDownloadUrl: () => `${b}/v1/agents/kali-telemetry-agent.py`
  };
}
