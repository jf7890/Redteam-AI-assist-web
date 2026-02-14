import { useMemo, useState } from "react";
import { makeAiClient } from "../api/ai";
import { makeAgentClient } from "../api/agent";
import { isLikelyMixedContent } from "../config";
import { useAppStore } from "../state/useAppStore";

function Dot({ status }: { status: "unknown" | "ok" | "error" }) {
  const cls = status === "ok" ? "dot-ok" : status === "error" ? "dot-bad" : "dot-unknown";
  return <span className={"dot " + cls} aria-hidden="true" />;
}

export function StatusBanner() {
  const { config, aiHealth, agentHealth, setAiHealth, setAgentHealth } = useAppStore();
  const [testing, setTesting] = useState<"none" | "ai" | "agent">("none");

  const ai = useMemo(() => makeAiClient(config.aiBaseUrl), [config.aiBaseUrl]);
  const agent = useMemo(() => makeAgentClient(config.localAgentUrl), [config.localAgentUrl]);

  const mixed = isLikelyMixedContent(config.localAgentUrl);

  async function testAi() {
    setTesting("ai");
    try {
      await ai.health();
      setAiHealth({ status: "ok", message: "AI server reachable" });
    } catch (e: any) {
      setAiHealth({ status: "error", message: e?.message || "AI server not reachable" });
    } finally {
      setTesting("none");
    }
  }

  async function testAgent() {
    setTesting("agent");
    try {
      await agent.health();
      setAgentHealth({ status: "ok", message: "Local agent reachable" });
    } catch (e: any) {
      setAgentHealth({ status: "error", message: e?.message || "Local agent not reachable" });
    } finally {
      setTesting("none");
    }
  }

  return (
    <div className="statusBanner">
      <div className="statusRow">
        <div className="statusItem">
          <Dot status={aiHealth.status} />
          <div>
            <div className="statusTitle">AI Server</div>
            <div className="statusSub">
              <code>{config.aiBaseUrl}</code>
              {aiHealth.checkedAt ? <span className="muted"> • checked {new Date(aiHealth.checkedAt).toLocaleString()}</span> : null}
            </div>
            {aiHealth.message ? <div className={"statusMsg " + (aiHealth.status === "ok" ? "ok" : "bad")}>{aiHealth.message}</div> : null}
          </div>
        </div>

        <div className="statusItem">
          <Dot status={agentHealth.status} />
          <div>
            <div className="statusTitle">Local Agent</div>
            <div className="statusSub">
              <code>{config.localAgentUrl}</code>
              {agentHealth.checkedAt ? <span className="muted"> • checked {new Date(agentHealth.checkedAt).toLocaleString()}</span> : null}
            </div>
            {agentHealth.message ? <div className={"statusMsg " + (agentHealth.status === "ok" ? "ok" : "bad")}>{agentHealth.message}</div> : null}
          </div>
        </div>

        <div className="statusActions">
          <button className="btn" onClick={testAi} disabled={testing !== "none"}>
            {testing === "ai" ? "Testing…" : "Test AI Server"}
          </button>
          <button className="btn" onClick={testAgent} disabled={testing !== "none"}>
            {testing === "agent" ? "Testing…" : "Test Local Agent"}
          </button>
        </div>
      </div>

      {mixed ? (
        <div className="warningBox">
          <b>Potential mixed-content block:</b> This UI is served over <code>https</code> but Local Agent is <code>http</code>. Some browsers may block calls
          to <code>http://127.0.0.1</code>. Consider running the UI over HTTP in lab, or enabling HTTPS on the agent.
        </div>
      ) : null}
    </div>
  );
}
