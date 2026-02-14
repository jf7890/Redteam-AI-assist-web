    import React, { useMemo, useState } from "react";
    import { makeAiClient } from "../api/ai";
    import { makeAgentClient } from "../api/agent";
    import type { SessionRecord } from "../api/types";
    import { JsonPanel } from "../components/JsonPanel";
    import { useAppStore, parseTargetsCsv } from "../state/useAppStore";

    function splitLines(text: string): string[] {
      return text
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);
    }

    export function AgentPage() {
      const cfg = useAppStore((s) => s.config);
      const sessionId = useAppStore((s) => s.sessionId);

      const ai = useMemo(() => makeAiClient(cfg.aiBaseUrl), [cfg.aiBaseUrl]);
      const agent = useMemo(() => makeAgentClient(cfg.localAgentUrl), [cfg.localAgentUrl]);

      const [targetsCsv, setTargetsCsv] = useState(cfg.defaultTargetsCsv);
      const [enableNmap, setEnableNmap] = useState(false);
      const [fullPort, setFullPort] = useState(false);
      const [verbose, setVerbose] = useState(true);
      const [once, setOnce] = useState(true);

      const [historyFiles, setHistoryFiles] = useState("");
      const [agentResp, setAgentResp] = useState<any>(null);

      const [session, setSession] = useState<SessionRecord | null>(null);
      const [busy, setBusy] = useState(false);
      const [err, setErr] = useState<string>("");

      const downloadUrl = ai.kaliAgentDownloadUrl();

      async function refreshSession() {
        if (!sessionId) return;
        setErr("");
        setBusy(true);
        try {
          const s = await ai.getSession(sessionId);
          setSession(s);
        } catch (e: any) {
          setErr(e?.message || String(e));
        } finally {
          setBusy(false);
        }
      }

      async function doAutoRecon() {
        if (!sessionId) {
          setErr("Missing SESSION_ID. Go to Session page → Create/Load session first.");
          return;
        }
        setErr("");
        setBusy(true);
        try {
          const resp = await agent.autoRecon({
            session_id: sessionId,
            base_url: cfg.aiBaseUrl,
            targets: parseTargetsCsv(targetsCsv),
            enable_nmap: enableNmap,
            full_port: fullPort,
            once,
            verbose
          });
          setAgentResp(resp);
        } catch (e: any) {
          setErr(e?.message || String(e));
          setAgentResp(null);
        } finally {
          setBusy(false);
        }
      }

      async function doIngestHistory() {
        if (!sessionId) {
          setErr("Missing SESSION_ID. Go to Session page → Create/Load session first.");
          return;
        }
        setErr("");
        setBusy(true);
        try {
          const resp = await agent.ingestHistory({
            session_id: sessionId,
            base_url: cfg.aiBaseUrl,
            history_files: splitLines(historyFiles),
            once,
            verbose
          });
          setAgentResp(resp);
        } catch (e: any) {
          setErr(e?.message || String(e));
          setAgentResp(null);
        } finally {
          setBusy(false);
        }
      }

      return (
        <>
          <h2>Telemetry / Agent</h2>

          {err && <div className="error">{err}</div>}

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Download agent (CLI script from AI server)</h3>
            <div className="muted">
              Backend Redteam-AI-assist có sẵn script <span className="mono">kali_telemetry_agent.py</span> để auto-ingest shell history
              (không phải HTTP agent). Nút bên dưới chỉ tải file về máy đang mở browser.
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <a href={downloadUrl} target="_blank" rel="noreferrer">
                <button className="secondary">Download kali-telemetry-agent.py</button>
              </a>
              <button className="secondary" onClick={refreshSession} disabled={busy || !sessionId}>
                Refresh Session
              </button>
            </div>

            <div className="muted" style={{ marginTop: 12 }}>
              CLI quickstart (chạy trên Kali):
              <pre className="mono" style={{ marginTop: 8 }}>
{`curl -fsSL ${downloadUrl} -o /tmp/kali_telemetry_agent.py
BASE_URL=${cfg.aiBaseUrl} SESSION_ID=${sessionId || "<SESSION_ID>"} python /tmp/kali_telemetry_agent.py --poll-interval 5 --verbose`}
              </pre>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Local Agent HTTP API (localhost:8787)</h3>
            <div className="muted">
              Các nút dưới đây yêu cầu bạn có Local Agent HTTP API (ngoài repo UI) chạy trên{" "}
              <span className="mono">{cfg.localAgentUrl}</span>. Agent sẽ chạy tool (nmap/whatweb/...) và tự POST telemetry về AI server.
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <div>
                <label>Targets (CSV)</label>
                <input value={targetsCsv} onChange={(e) => setTargetsCsv(e.target.value)} />
                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox" checked={enableNmap} onChange={(e) => setEnableNmap(e.target.checked)} />
                    enable_nmap
                  </label>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={fullPort}
                      onChange={(e) => setFullPort(e.target.checked)}
                      disabled={!enableNmap}
                    />
                    full_port
                  </label>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox" checked={once} onChange={(e) => setOnce(e.target.checked)} />
                    once
                  </label>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox" checked={verbose} onChange={(e) => setVerbose(e.target.checked)} />
                    verbose
                  </label>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <button onClick={doAutoRecon} disabled={busy}>
                    Auto Recon (via Local Agent)
                  </button>
                </div>
              </div>

              <div>
                <label>History files (optional, one per line)</label>
                <textarea
                  value={historyFiles}
                  onChange={(e) => setHistoryFiles(e.target.value)}
                  placeholder="/home/kali/.zsh_history&#10;/home/kali/.bash_history"
                />
                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <button onClick={doIngestHistory} disabled={busy}>
                    Ingest History (via Local Agent)
                  </button>
                </div>
              </div>
            </div>

            <div className="muted" style={{ marginTop: 12 }}>
              Nếu bạn chưa có Local Agent HTTP API, UI sẽ báo lỗi connection. Đây là expected theo spec (agent là dependency ngoài).
            </div>
          </div>

          {session && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Session snapshot</h3>
              <div className="muted">
                current_phase=<span className="mono">{session.current_phase}</span> · events=
                <span className="mono">{session.events?.length ?? 0}</span> · updated=
                <span className="mono">{new Date(session.updated_at).toLocaleString()}</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <JsonPanel value={session} />
              </div>
            </div>
          )}

          {agentResp && (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Local Agent response (raw)</h3>
              <JsonPanel value={agentResp} />
            </div>
          )}
        </>
      );
    }
