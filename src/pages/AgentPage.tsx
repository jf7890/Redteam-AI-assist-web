import { useMemo, useState } from "react";
import { makeAgentClient } from "../api/agent";
import { makeAiClient } from "../api/ai";
import { JsonPanel } from "../components/JsonPanel";
import { useAppStore, parseTargetsCsv } from "../state/useAppStore";

export function AgentPage() {
  const { config, sessionId, setSession, setSessionError, setAgentError, agentError, lastAgentResult, setLastAgentResult } = useAppStore();

  const agent = useMemo(() => makeAgentClient(config.localAgentUrl), [config.localAgentUrl]);
  const ai = useMemo(() => makeAiClient(config.aiBaseUrl), [config.aiBaseUrl]);

  const [enableNmap, setEnableNmap] = useState(true);
  const [fullPort, setFullPort] = useState(false);
  const [verbose, setVerbose] = useState(true);
  const [once, setOnce] = useState(true);

  const [targetsCsv, setTargetsCsv] = useState(config.defaultTargetsCsv);

  const [busy, setBusy] = useState<null | "recon" | "history" | "refresh">(null);

  const agentDownloadUrl = `${config.aiBaseUrl.replace(/\/+$/, "")}/kali-telemetry-agent.py`;

  async function autoRecon() {
    if (!sessionId) return;
    setBusy("recon");
    setAgentError(undefined);

    try {
      const res = await agent.autoRecon({
        session_id: sessionId,
        base_url: config.aiBaseUrl,
        targets: parseTargetsCsv(targetsCsv),
        enable_nmap: enableNmap,
        full_port: fullPort,
        once,
        verbose
      });

      setLastAgentResult(res);
    } catch (e: any) {
      setAgentError(e?.message || "Auto recon failed");
    } finally {
      setBusy(null);
    }
  }

  async function ingestHistory() {
    if (!sessionId) return;
    setBusy("history");
    setAgentError(undefined);

    try {
      const res = await agent.ingestHistory({
        session_id: sessionId,
        base_url: config.aiBaseUrl,
        once,
        verbose
      });

      setLastAgentResult(res);
    } catch (e: any) {
      setAgentError(e?.message || "Ingest history failed");
    } finally {
      setBusy(null);
    }
  }

  async function refreshSession() {
    if (!sessionId) return;
    setBusy("refresh");
    setSessionError(undefined);
    try {
      const s = await ai.getSession(sessionId);
      setSession(s);
    } catch (e: any) {
      setSessionError(e?.message || "Failed to refresh session");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="page">
      <h2>Telemetry / Local Agent</h2>

      <div className="panel">
        <div className="panelHeader">
          <div className="panelTitle">Download Agent</div>
        </div>
        <p className="muted">
          The agent is hosted by the AI server (expected path: <code>/kali-telemetry-agent.py</code>). If your deployment uses a different path, adjust accordingly.
        </p>
        <a className="btn" href={agentDownloadUrl} target="_blank" rel="noreferrer">
          Download kali-telemetry-agent.py
        </a>
      </div>

      {!sessionId ? <div className="warningBox">Set a SESSION_ID in Setup/Session page before running auto tools.</div> : null}

      <div className="grid2">
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Auto Recon</div>
          </div>

          <label className="field">
            <div className="fieldLabel">Targets (CSV)</div>
            <input className="input" value={targetsCsv} onChange={(e) => setTargetsCsv(e.target.value)} />
          </label>

          <div className="row">
            <label className="checkbox">
              <input type="checkbox" checked={enableNmap} onChange={(e) => setEnableNmap(e.target.checked)} /> Enable nmap
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={fullPort} onChange={(e) => setFullPort(e.target.checked)} /> Full port
            </label>
          </div>

          <div className="row">
            <label className="checkbox">
              <input type="checkbox" checked={once} onChange={(e) => setOnce(e.target.checked)} /> Once
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={verbose} onChange={(e) => setVerbose(e.target.checked)} /> Verbose
            </label>
          </div>

          <button className="btn" onClick={autoRecon} disabled={!sessionId || busy !== null}>
            {busy === "recon" ? "Running…" : "Auto Recon (HEAD)"}
          </button>

          <p className="muted">
            The Local Agent will run tools on the client and POST telemetry to <code>{config.aiBaseUrl}</code> at <code>/v1/sessions/{sessionId}/events</code>.
          </p>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Ingest History</div>
          </div>

          <p className="muted">Reads shell / tool history on the client (agent side) and posts as telemetry events.</p>

          <div className="row">
            <label className="checkbox">
              <input type="checkbox" checked={once} onChange={(e) => setOnce(e.target.checked)} /> Once
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={verbose} onChange={(e) => setVerbose(e.target.checked)} /> Verbose
            </label>
          </div>

          <button className="btn" onClick={ingestHistory} disabled={!sessionId || busy !== null}>
            {busy === "history" ? "Running…" : "Ingest History (once)"}
          </button>

          <div className="row">
            <button className="btn btn-secondary" onClick={refreshSession} disabled={!sessionId || busy !== null}>
              {busy === "refresh" ? "Refreshing…" : "Refresh Session"}
            </button>
          </div>

          {agentError ? (
            <div className="errorBox">
              <b>Agent call failed.</b>
              <div>{agentError}</div>
              <div className="muted" style={{ marginTop: 8 }}>
                If the agent is not running, start it on the client at <code>{config.localAgentUrl}</code> (bind to localhost) and enable CORS for this UI origin.
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {lastAgentResult ? <JsonPanel title="Last agent response (raw)" data={lastAgentResult} /> : null}
    </div>
  );
}
