import React, { useMemo, useState } from "react";
import { makeAiClient } from "../api/ai";
import type { PhaseName, RagFocus, MemoryMode, SuggestResponse } from "../api/types";
import { JsonPanel } from "../components/JsonPanel";
import { MarkdownPanel } from "../components/MarkdownPanel";
import { useAppStore } from "../state/useAppStore";

const PHASES: PhaseName[] = ["recon", "enumeration", "hypothesis", "attempt", "post_check", "report"];
const MEMORY: MemoryMode[] = ["summary", "window", "full"];
const RAG: RagFocus[] = ["auto", "recon", "report"];

export function SuggestPage() {
  const cfg = useAppStore((s) => s.config);
  const sessionId = useAppStore((s) => s.sessionId);

  const ai = useMemo(() => makeAiClient(cfg.aiBaseUrl), [cfg.aiBaseUrl]);

  const [userMessage, setUserMessage] = useState("");
  const [memoryMode, setMemoryMode] = useState<MemoryMode>("window");
  const [historyWindow, setHistoryWindow] = useState<number>(12);
  const [phaseOverride, setPhaseOverride] = useState<string>("");
  const [persistOverride, setPersistOverride] = useState(false);
  const [ragFocus, setRagFocus] = useState<RagFocus>("auto");

  const [resp, setResp] = useState<SuggestResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");

  async function getSuggest(focus?: RagFocus) {
    if (!sessionId) {
      setErr("Missing SESSION_ID. Go to Session page → Create/Load session first.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const body: any = {
        memory_mode: memoryMode,
        history_window: historyWindow,
        persist_phase_override: persistOverride,
        rag_focus: focus ?? ragFocus
      };
      if (userMessage.trim()) body.user_message = userMessage.trim();
      if (phaseOverride) body.phase_override = phaseOverride;
      const out = await ai.suggest(sessionId, body);
      setResp(out);
    } catch (e: any) {
      setErr(e?.message || String(e));
      setResp(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2>Suggest</h2>

      {err && <div className="error">{err}</div>}

      <div className="card">
        <div className="muted" style={{ marginBottom: 10 }}>
          POST <span className="mono">/v1/sessions/{sessionId || "<SESSION_ID>"}/suggest</span>
        </div>

        <div className="row">
          <div>
            <label>User message (optional)</label>
            <textarea value={userMessage} onChange={(e) => setUserMessage(e.target.value)} placeholder="What should I do next?" />
          </div>
          <div>
            <label>Controls</label>
            <div className="row">
              <div>
                <label>memory_mode</label>
                <select value={memoryMode} onChange={(e) => setMemoryMode(e.target.value as MemoryMode)}>
                  {MEMORY.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>history_window (1–120)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={historyWindow}
                  onChange={(e) => setHistoryWindow(parseInt(e.target.value || "12", 10))}
                />
              </div>
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <div>
                <label>phase_override (optional)</label>
                <select value={phaseOverride} onChange={(e) => setPhaseOverride(e.target.value)}>
                  <option value="">(none)</option>
                  {PHASES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>rag_focus</label>
                <select value={ragFocus} onChange={(e) => setRagFocus(e.target.value as RagFocus)}>
                  {RAG.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
              <input type="checkbox" checked={persistOverride} onChange={(e) => setPersistOverride(e.target.checked)} />
              persist_phase_override
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button onClick={() => getSuggest()} disabled={busy}>
                Get Suggest
              </button>
              <button className="secondary" onClick={() => getSuggest("report")} disabled={busy}>
                Get Report Template (rag_focus=report)
              </button>
            </div>
          </div>
        </div>
      </div>

      {resp && (
        <>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>
              Phase: <span className="pill">{resp.phase}</span>{" "}
              <span className="muted">confidence {Math.round(resp.phase_confidence * 100)}%</span>
            </h3>

            <div className="row">
              <div>
                <div className="muted" style={{ marginBottom: 6 }}>Missing artifacts</div>
                {(resp.missing_artifacts || []).length === 0 ? (
                  <div className="muted">—</div>
                ) : (
                  <div>
                    {resp.missing_artifacts.map((x) => (
                      <span key={x} className="pill">{x}</span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="muted" style={{ marginBottom: 6 }}>Episode summary</div>
                <div>{resp.episode_summary}</div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="muted" style={{ marginBottom: 6 }}>Reasoning</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{resp.reasoning}</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Actions</h3>
            {resp.actions?.length ? (
              <div className="actions-grid">
                {resp.actions.map((a, idx) => (
                  <div key={idx} className="card" style={{ marginBottom: 0 }}>
                    <b>{a.title}</b>
                    {a.command && (
                      <div style={{ marginTop: 8 }}>
                        <div className="muted">command</div>
                        <pre className="mono">{a.command}</pre>
                      </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <div className="muted">rationale</div>
                      <div style={{ whiteSpace: "pre-wrap" }}>{a.rationale}</div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div className="muted">done_criteria</div>
                      <div style={{ whiteSpace: "pre-wrap" }}>{a.done_criteria}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">No actions.</div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Retrieved context (RAG)</h3>
            {resp.retrieved_context?.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {resp.retrieved_context.map((c, idx) => (
                  <details key={idx}>
                    <summary>
                      <span className="mono">{c.source}</span> · <span className="muted">score {c.score.toFixed(3)}</span>
                    </summary>
                    <div style={{ marginTop: 10 }}>
                      <MarkdownPanel content={c.content} />
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="muted">No context.</div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Raw JSON</h3>
            <JsonPanel value={resp} />
          </div>
        </>
      )}
    </>
  );
}
