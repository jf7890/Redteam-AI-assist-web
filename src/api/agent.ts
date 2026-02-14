import { httpJson } from "./http";

export function makeAgentClient(baseUrl: string) {
  const b = baseUrl.replace(/\/+$/, "");

  return {
    baseUrl: b,

    health: () => httpJson<{ status?: string }>(`${b}/health`, { method: "GET" }),

    autoRecon: (body: {
      session_id: string;
      base_url: string;
      targets: string[];
      enable_nmap: boolean;
      full_port: boolean;
      once: boolean;
      verbose: boolean;
    }) =>
      httpJson<any>(`${b}/auto-recon`, {
        method: "POST",
        body: JSON.stringify(body),
        timeoutMs: 120000
      }),

    ingestHistory: (body: {
      session_id: string;
      base_url: string;
      history_files?: string[];
      once: boolean;
      verbose: boolean;
    }) =>
      httpJson<any>(`${b}/ingest-history`, {
        method: "POST",
        body: JSON.stringify(body),
        timeoutMs: 120000
      }),

    run: (body: { command: string; timeout?: number }) =>
      httpJson<any>(`${b}/run`, {
        method: "POST",
        body: JSON.stringify(body),
        timeoutMs: 120000
      })
  };
}
