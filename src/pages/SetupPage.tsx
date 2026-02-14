import { useEffect, useState } from "react";
import { useAppStore } from "../state/useAppStore";

export function SetupPage() {
  const { config, sessionId, setConfig, resetConfigToRuntime, setSessionId } = useAppStore();

  const [aiBaseUrl, setAiBaseUrl] = useState(config.aiBaseUrl);
  const [agentUrl, setAgentUrl] = useState(config.localAgentUrl);
  const [targetsCsv, setTargetsCsv] = useState(config.defaultTargetsCsv);
  const [policyId, setPolicyId] = useState(config.policyId);
  const [tenantId, setTenantId] = useState(config.tenantId);
  const [userId, setUserId] = useState(config.userId);
  const [agentId, setAgentId] = useState(config.agentId);
  const [sid, setSid] = useState(sessionId);

  useEffect(() => {
    // If config changed externally (e.g. reset), reflect in local form
    setAiBaseUrl(config.aiBaseUrl);
    setAgentUrl(config.localAgentUrl);
    setTargetsCsv(config.defaultTargetsCsv);
    setPolicyId(config.policyId);
    setTenantId(config.tenantId);
    setUserId(config.userId);
    setAgentId(config.agentId);
  }, [config]);

  useEffect(() => setSid(sessionId), [sessionId]);

  function save() {
    setConfig({
      aiBaseUrl: aiBaseUrl.trim(),
      localAgentUrl: agentUrl.trim(),
      defaultTargetsCsv: targetsCsv,
      policyId: policyId.trim(),
      tenantId: tenantId.trim(),
      userId: userId.trim(),
      agentId: agentId.trim()
    });
    setSessionId(sid.trim());
  }

  function reset() {
    resetConfigToRuntime();
  }

  return (
    <div className="page">
      <h2>Setup</h2>
      <p className="muted">
        Lab-only UI. Configuration is stored in your browser (localStorage). Docker runtime can also inject config via <code>/env.js</code>.
      </p>

      <div className="grid2">
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Endpoints</div>
          </div>

          <label className="field">
            <div className="fieldLabel">AI_BASE_URL</div>
            <input className="input" value={aiBaseUrl} onChange={(e) => setAiBaseUrl(e.target.value)} placeholder="http://127.0.0.1:8088" />
          </label>

          <label className="field">
            <div className="fieldLabel">LOCAL_AGENT_URL</div>
            <input className="input" value={agentUrl} onChange={(e) => setAgentUrl(e.target.value)} placeholder="http://127.0.0.1:8787" />
            <div className="fieldHint muted">Browser calls the local agent directly; the agent must allow CORS for this UI origin.</div>
          </label>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Defaults</div>
          </div>

          <label className="field">
            <div className="fieldLabel">DEFAULT_TARGETS (CSV)</div>
            <input className="input" value={targetsCsv} onChange={(e) => setTargetsCsv(e.target.value)} placeholder="172.16.100.128,dvwa.local" />
          </label>

          <label className="field">
            <div className="fieldLabel">DEFAULT_POLICY_ID</div>
            <input className="input" value={policyId} onChange={(e) => setPolicyId(e.target.value)} placeholder="lab-default" />
          </label>

          <div className="grid2">
            <label className="field">
              <div className="fieldLabel">DEFAULT_TENANT_ID</div>
              <input className="input" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
            </label>
            <label className="field">
              <div className="fieldLabel">DEFAULT_USER_ID</div>
              <input className="input" value={userId} onChange={(e) => setUserId(e.target.value)} />
            </label>
          </div>

          <label className="field">
            <div className="fieldLabel">DEFAULT_AGENT_ID</div>
            <input className="input" value={agentId} onChange={(e) => setAgentId(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="panel">
        <div className="panelHeader">
          <div className="panelTitle">Session Shortcut</div>
        </div>

        <label className="field">
          <div className="fieldLabel">SESSION_ID (optional)</div>
          <input className="input" value={sid} onChange={(e) => setSid(e.target.value)} placeholder="Paste existing session id…" />
          <div className="fieldHint muted">Used by Session/Suggest/Agent pages.</div>
        </label>
      </div>

      <div className="row">
        <button className="btn" onClick={save}>
          Save
        </button>
        <button className="btn btn-secondary" onClick={reset}>
          Reset to runtime defaults
        </button>
      </div>
    </div>
  );
}
