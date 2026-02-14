import { useMemo, useState } from "react";
import { makeAiClient } from "../api/ai";
import type { CreateSessionRequest } from "../api/types";
import { JsonPanel } from "../components/JsonPanel";
import { KeyValue } from "../components/KeyValue";
import { parseTargetsCsv, useAppStore } from "../state/useAppStore";

export function SessionPage() {
  const { config, sessionId, setSessionId, session, setSession, sessionError, setSessionError } = useAppStore();
  const ai = useMemo(() => makeAiClient(config.aiBaseUrl), [config.aiBaseUrl]);

  const [objective, setObjective] = useState("Recon + exploitation practice in lab");
  const [targetsCsv, setTargetsCsv] = useState(config.defaultTargetsCsv);
  const [policyId, setPolicyId] = useState(config.policyId);

  const [busy, setBusy] = useState<null | "create" | "load" | "delete" | "list">(null);
  const [list, setList] = useState<any[] | null>(null);

  async function createSession() {
    setBusy("create");
    setSessionError(undefined);
    try {
      const body: CreateSessionRequest = {
        tenant_id: config.tenantId,
        user_id: config.userId,
        agent_id: config.agentId,
        objective: objective.trim(),
        target_scope: parseTargetsCsv(targetsCsv),
        policy_id: policyId.trim()
      };
      const s = await ai.createSession(body);
      setSessionId(s.id);
      setSession(s);
    } catch (e: any) {
      setSessionError(e?.message || "Failed to create session");
    } finally {
      setBusy(null);
    }
  }

  async function loadSession() {
    if (!sessionId) return;
    setBusy("load");
    setSessionError(undefined);
    try {
      const s = await ai.getSession(sessionId);
      setSession(s);
    } catch (e: any) {
      setSession(undefined);
      setSessionError(e?.message || "Failed to load session");
    } finally {
      setBusy(null);
    }
  }

  async function deleteSession() {
    if (!sessionId) return;
    setBusy("delete");
    setSessionError(undefined);
    try {
      await ai.deleteSession(sessionId);
      setSession(undefined);
      setSessionId("");
    } catch (e: any) {
      setSessionError(e?.message || "Failed to delete session");
    } finally {
      setBusy(null);
    }
  }

  async function listSessions() {
    setBusy("list");
    setSessionError(undefined);
    try {
      const xs = await ai.listSessions(config.tenantId, config.userId, 20);
      setList(xs as any[]);
    } catch (e: any) {
      setSessionError(e?.message || "Failed to list sessions");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="page">
      <h2>Session</h2>

      <div className="grid2">
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Create Session</div>
          </div>

          <label className="field">
            <div className="fieldLabel">Objective</div>
            <textarea className="textarea" rows={3} value={objective} onChange={(e) => setObjective(e.target.value)} />
          </label>

          <label className="field">
            <div className="fieldLabel">Target Scope (CSV)</div>
            <input className="input" value={targetsCsv} onChange={(e) => setTargetsCsv(e.target.value)} placeholder="172.16.100.128,dvwa.local" />
          </label>

          <label className="field">
            <div className="fieldLabel">Policy ID</div>
            <input className="input" value={policyId} onChange={(e) => setPolicyId(e.target.value)} placeholder="lab-default" />
          </label>

          <button className="btn" onClick={createSession} disabled={busy !== null}>
            {busy === "create" ? "Creating…" : "Create Session"}
          </button>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Load / Delete</div>
          </div>

          <label className="field">
            <div className="fieldLabel">SESSION_ID</div>
            <input className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Session id…" />
          </label>

          <div className="row">
            <button className="btn" onClick={loadSession} disabled={!sessionId || busy !== null}>
              {busy === "load" ? "Loading…" : "Load Session"}
            </button>
            <button className="btn btn-danger" onClick={deleteSession} disabled={!sessionId || busy !== null}>
              {busy === "delete" ? "Deleting…" : "Delete Session"}
            </button>
          </div>

          <div className="row">
            <button className="btn btn-secondary" onClick={listSessions} disabled={busy !== null}>
              {busy === "list" ? "Loading…" : "List Recent Sessions"}
            </button>
          </div>

          {sessionError ? <div className="errorBox">{sessionError}</div> : null}
        </div>
      </div>

      {session ? (
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Session Metadata</div>
          </div>

          <div className="kvGrid">
            <KeyValue label="id" value={session.id} />
            <KeyValue label="phase" value={session.phase} />
            <KeyValue label="policy_id" value={session.policy_id} />
            <KeyValue label="objective" value={session.objective} />
          </div>

          <div className="kvGrid">
            <KeyValue label="missing_artifacts" value={Array.isArray(session.missing_artifacts) ? session.missing_artifacts.join(", ") : ""} />
            <KeyValue label="target_scope" value={Array.isArray(session.target_scope) ? session.target_scope.join(", ") : ""} />
          </div>

          {session.episode_summary ? (
            <div className="panel">
              <div className="panelHeader">
                <div className="panelTitle">Episode Summary</div>
              </div>
              <div className="markdown">
                <pre className="codeBlock" style={{ whiteSpace: "pre-wrap" }}>{session.episode_summary}</pre>
              </div>
            </div>
          ) : null}

          <JsonPanel title="Raw session JSON" data={session} />
        </div>
      ) : (
        <div className="muted">No session loaded yet.</div>
      )}

      {list ? <JsonPanel title="Recent sessions (raw)" data={list} /> : null}
    </div>
  );
}
