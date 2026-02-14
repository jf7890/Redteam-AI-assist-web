import React, { useMemo, useState } from "react";
import { makeAiClient } from "../api/ai";
import type { SessionRecord, SessionSummary } from "../api/types";
import { JsonPanel } from "../components/JsonPanel";
import { KeyValue } from "../components/KeyValue";
import { useAppStore, parseTargetsCsv } from "../state/useAppStore";

export function SessionPage() {
  const cfg = useAppStore((s) => s.config);
  const sessionId = useAppStore((s) => s.sessionId);
  const setSessionId = useAppStore((s) => s.setSessionId);
  const clearSessionId = useAppStore((s) => s.clearSessionId);

  const ai = useMemo(() => makeAiClient(cfg.aiBaseUrl), [cfg.aiBaseUrl]);

  const [loadId, setLoadId] = useState(sessionId || "");
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");

  async function createSession() {
    setErr("");
    setBusy(true);
    try {
      const created = await ai.createSession({
        tenant_id: cfg.tenantId,
        user_id: cfg.userId,
        agent_id: cfg.agentId,
        objective: cfg.objective,
        target_scope: parseTargetsCsv(cfg.defaultTargetsCsv),
        policy_id: cfg.policyId
      });
      setSession(created);
      setSessionId(created.session_id);
      setLoadId(created.session_id);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function fetchSession(id: string) {
    setErr("");
    setBusy(true);
    try {
      const s = await ai.getSession(id);
      setSession(s);
      setSessionId(id);
    } catch (e: any) {
      setErr(e?.message || String(e));
      setSession(null);
    } finally {
      setBusy(false);
    }
  }

  async function listSessions() {
    setErr("");
    setBusy(true);
    try {
      const items = await ai.listSessions(cfg.tenantId, cfg.userId, 100);
      setSessions(items);
    } catch (e: any) {
      setErr(e?.message || String(e));
      setSessions(null);
    } finally {
      setBusy(false);
    }
  }

  async function deleteCurrent() {
    if (!sessionId) return;
    setErr("");
    setBusy(true);
    try {
      await ai.deleteSession(sessionId);
      setSession(null);
      clearSessionId();
      setLoadId("");
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2>Session</h2>

      {err && <div className="error">{err}</div>}

      <div className="card">
        <div className="muted" style={{ marginBottom: 10 }}>
          Tạo session mới → ingest telemetry → gọi Suggest. Session ID sẽ được lưu vào localStorage.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={createSession} disabled={busy}>
            Create Session
          </button>
          <button className="secondary" onClick={() => fetchSession(loadId)} disabled={busy || !loadId}>
            Load Session
          </button>
          <button className="secondary" onClick={deleteCurrent} disabled={busy || !sessionId}>
            Delete Session
          </button>
          <button className="secondary" onClick={listSessions} disabled={busy}>
            List Sessions
          </button>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <label>SESSION_ID</label>
            <input value={loadId} onChange={(e) => setLoadId(e.target.value)} placeholder="paste session id..." />
          </div>
          <div>
            <label>Defaults (from Setup)</label>
            <div className="muted">
              tenant=<span className="mono">{cfg.tenantId}</span> · user=<span className="mono">{cfg.userId}</span> ·
              agent=<span className="mono">{cfg.agentId}</span>
              <br />
              policy=<span className="mono">{cfg.policyId}</span> · targets=<span className="mono">{cfg.defaultTargetsCsv || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {sessions && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Sessions list</h3>
          {sessions.length === 0 ? (
            <div className="muted">No sessions.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {sessions.map((s) => (
                <div key={s.session_id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="pill">{s.current_phase}</span>
                  <span className="mono" style={{ fontSize: 12 }}>
                    {s.session_id}
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    updated {new Date(s.updated_at).toLocaleString()}
                  </span>
                  <button className="secondary" style={{ marginLeft: "auto" }} onClick={() => fetchSession(s.session_id)}>
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {session && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Session record</h3>
          <div className="row">
            <div>
              <KeyValue k="session_id" v={<span className="mono">{session.session_id}</span>} />
              <KeyValue k="current_phase" v={<span className="pill">{session.current_phase}</span>} />
              <KeyValue k="updated_at" v={<span className="mono">{new Date(session.updated_at).toLocaleString()}</span>} />
            </div>
            <div>
              <KeyValue k="target_scope" v={<span className="mono">{(session.target_scope || []).join(", ") || "—"}</span>} />
              <KeyValue k="events" v={<span className="mono">{session.events?.length ?? 0}</span>} />
              <KeyValue k="notes" v={<span className="mono">{session.notes?.length ?? 0}</span>} />
            </div>
          </div>

          {session.cached_suggest?.payload && (
            <div style={{ marginTop: 10 }}>
              <div className="muted" style={{ marginBottom: 6 }}>cached_suggest.payload (raw)</div>
              <JsonPanel value={session.cached_suggest.payload} />
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <div className="muted" style={{ marginBottom: 6 }}>Full SessionRecord (raw JSON)</div>
            <JsonPanel value={session} />
          </div>
        </div>
      )}
    </>
  );
}
