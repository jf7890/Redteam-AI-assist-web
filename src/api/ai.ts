import { httpJson } from "./http";
import type { AddEventsRequest, CreateSessionRequest, Session, SuggestRequest, SuggestResponse } from "./types";

export function makeAiClient(baseUrl: string) {
  const b = baseUrl.replace(/\/+$/, "");

  return {
    baseUrl: b,

    health: () => httpJson<{ status?: string }>(`${b}/health`, { method: "GET" }),

    createSession: (body: CreateSessionRequest) =>
      httpJson<Session>(`${b}/v1/sessions`, { method: "POST", body: JSON.stringify(body) }),

    getSession: (id: string) =>
      httpJson<Session>(`${b}/v1/sessions/${encodeURIComponent(id)}`, { method: "GET" }),

    listSessions: (tenant_id: string, user_id: string, limit = 20) =>
      httpJson<Session[]>(
        `${b}/v1/sessions?tenant_id=${encodeURIComponent(tenant_id)}&user_id=${encodeURIComponent(user_id)}&limit=${limit}`,
        { method: "GET" }
      ),

    addEvents: (id: string, body: AddEventsRequest) =>
      httpJson<{ ok?: boolean }>(`${b}/v1/sessions/${encodeURIComponent(id)}/events`, {
        method: "POST",
        body: JSON.stringify(body)
      }),

    suggest: (id: string, body: SuggestRequest) =>
      httpJson<SuggestResponse>(`${b}/v1/sessions/${encodeURIComponent(id)}/suggest`, {
        method: "POST",
        body: JSON.stringify(body),
        timeoutMs: 30000
      }),

    deleteSession: (id: string) =>
      httpJson<{ ok?: boolean }>(`${b}/v1/sessions/${encodeURIComponent(id)}`, { method: "DELETE" })
  };
}
