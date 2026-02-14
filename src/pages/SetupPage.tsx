import React, { useMemo, useState } from "react";
import { makeAiClient } from "../api/ai";
import { makeAgentClient } from "../api/agent";
import { StatusBanner, StatusKind } from "../components/StatusBanner";
import { useAppStore } from "../state/useAppStore";

export function SetupPage() {
  const stored = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  const resetConfigToRuntimeDefaults = useAppStore((s) => s.resetConfigToRuntimeDefaults);
  const clearSessionId = useAppStore((s) => s.clearSessionId);

  const [draft, setDraft] = useState(stored);

  // If stored config changes (Reset), keep draft in sync
  React.useEffect(() => setDraft(stored), [stored]);

  const ai = useMemo(() => makeAiClient(draft.aiBaseUrl), [draft.aiBaseUrl]);
  const agent = useMemo(() => makeAgentClient(draft.localAgentUrl), [draft.localAgentUrl]);

  const [aiStatus, setAiStatus] = useState<StatusKind>("idle");
  const [aiMsg, setAiMsg] = useState<string>("");

  const [agentStatus, setAgentStatus] = useState<StatusKind>("idle");
  const [agentMsg, setAgentMsg] = useState<string>("");

  const httpsMixedContent =
    window.location.protocol === "https:" && draft.localAgentUrl.toLowerCase().startsWith("http://");

  async function testAi() {
    setAiStatus("idle");
    setAiMsg("");
    try {
      const res = await ai.health();
      setAiStatus("ok");
      setAiMsg(`status=${res.status}${res.app_env ? ` · env=${res.app_env}` : ""}`);
    } catch (e: any) {
      setAiStatus("error");
      setAiMsg(e?.message || String(e));
    }
  }

  async function testAgent() {
    setAgentStatus("idle");
    setAgentMsg("");
    try {
      const res = await agent.health();
      setAgentStatus("ok");
      setAgentMsg(`status=${res.status}`);
    } catch (e: any) {
      setAgentStatus("error");
      setAgentMsg(e?.message || String(e));
    }
  }

  function save() {
    setConfig(draft);
  }

  function reset() {
    resetConfigToRuntimeDefaults();
  }

  return (
    <>
      <h2>Setup</h2>

      {httpsMixedContent && (
        <div className="error">
          <b>Cảnh báo Mixed Content:</b> UI đang chạy HTTPS nhưng Local Agent URL là HTTP
          ({draft.localAgentUrl}). Một số browser có thể chặn call tới localhost HTTP.
          <div className="muted" style={{ marginTop: 6 }}>
            Lab dễ nhất: chạy UI bằng HTTP, hoặc triển khai agent hỗ trợ HTTPS.
          </div>
        </div>
      )}

      <StatusBanner title="AI Server" kind={aiStatus} message={aiMsg} />
      <StatusBanner title="Local Agent" kind={agentStatus} message={agentMsg} />

      <div className="card">
        <div className="row">
          <div>
            <label>AI_BASE_URL (Browser gọi tới AI Server)</label>
            <input
              value={draft.aiBaseUrl}
              onChange={(e) => setDraft({ ...draft, aiBaseUrl: e.target.value })}
              placeholder="http://127.0.0.1:8088"
            />
            <div className="muted" style={{ marginTop: 6 }}>
              Nếu AI server chạy trên máy khác → đặt IP/hostname của server đó (không dùng 127.0.0.1).
            </div>
          </div>

          <div>
            <label>LOCAL_AGENT_URL (Browser gọi tới Local Agent trên máy học viên)</label>
            <input
              value={draft.localAgentUrl}
              onChange={(e) => setDraft({ ...draft, localAgentUrl: e.target.value })}
              placeholder="http://127.0.0.1:8787"
            />
            <div className="muted" style={{ marginTop: 6 }}>
              127.0.0.1 luôn là máy chạy browser. Local agent nên bind localhost (127.0.0.1:8787).
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <label>DEFAULT_TARGETS (CSV)</label>
            <input
              value={draft.defaultTargetsCsv}
              onChange={(e) => setDraft({ ...draft, defaultTargetsCsv: e.target.value })}
              placeholder="172.16.100.128,dvwa.local"
            />
          </div>
          <div>
            <label>DEFAULT_POLICY_ID</label>
            <input
              value={draft.policyId}
              onChange={(e) => setDraft({ ...draft, policyId: e.target.value })}
              placeholder="lab-default"
            />
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <label>DEFAULT_TENANT_ID</label>
            <input value={draft.tenantId} onChange={(e) => setDraft({ ...draft, tenantId: e.target.value })} />
          </div>
          <div>
            <label>DEFAULT_USER_ID</label>
            <input value={draft.userId} onChange={(e) => setDraft({ ...draft, userId: e.target.value })} />
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <label>DEFAULT_AGENT_ID</label>
            <input value={draft.agentId} onChange={(e) => setDraft({ ...draft, agentId: e.target.value })} />
          </div>
          <div>
            <label>Objective</label>
            <input
              value={draft.objective}
              onChange={(e) => setDraft({ ...draft, objective: e.target.value })}
              placeholder="Complete the lab objective safely within allowed scope."
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button onClick={save}>Save config</button>
          <button className="secondary" onClick={reset}>
            Reset to runtime defaults
          </button>
          <button className="secondary" onClick={clearSessionId}>
            Clear SESSION_ID
          </button>
          <button className="secondary" onClick={testAi}>
            Test AI Server
          </button>
          <button className="secondary" onClick={testAgent}>
            Test Local Agent
          </button>
        </div>

        <div className="muted" style={{ marginTop: 12 }}>
          Tip: Nếu UI chạy tại <span className="mono">http://localhost:8080</span> mà AI chạy tại{" "}
          <span className="mono">http://127.0.0.1:8088</span>, backend FastAPI cần bật CORS cho origin
          <span className="mono"> http://localhost:8080</span>.
        </div>
      </div>
    </>
  );
}
