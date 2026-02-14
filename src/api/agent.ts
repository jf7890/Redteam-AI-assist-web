import { httpJson } from "./http";

export type AutoReconRequest = {
  session_id: string;
  base_url: string; // AI_BASE_URL
  targets: string[];
  enable_nmap: boolean;
  full_port: boolean;
  once: boolean;
  verbose: boolean;
};

export type IngestHistoryRequest = {
  session_id: string;
  base_url: string; // AI_BASE_URL
  history_files?: string[];
  once: boolean;
  verbose: boolean;
};

export function makeAgentClient(baseUrl: string) {
  const b = baseUrl.replace(/\/+$/, "");

  return {
    health: () => httpJson<{ status: string }>(`${b}/health`, { method: "GET", timeoutMs: 7000 }),

    autoRecon: (body: AutoReconRequest) =>
      httpJson<any>(`${b}/auto-recon`, {
        method: "POST",
        body: JSON.stringify(body),
        timeoutMs: 120000
      }),

    ingestHistory: (body: IngestHistoryRequest) =>
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
