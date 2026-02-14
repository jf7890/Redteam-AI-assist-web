import { useMemo, useState } from "react";
import { makeAiClient } from "../api/ai";
import type { SuggestRequest } from "../api/types";
import { JsonPanel } from "../components/JsonPanel";
import { MarkdownPanel } from "../components/MarkdownPanel";
import { useAppStore } from "../state/useAppStore";

type NormalizedSuggest = {
  actions: Array<{ title: string; description?: string; done_criteria?: string }>;
  rationale?: string;
  doneCriteria?: string;
  reportMarkdown?: string;
};

function toStr(v: any): string | undefined {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}

function deepGet(obj: any, path: string[]): any {
  let cur = obj;
  for (const k of path) {
    if (cur && typeof cur === "object" && k in cur) cur = cur[k];
    else return undefined;
  }
  return cur;
}

function firstOf(obj: any, paths: string[][]): any {
  for (const p of paths) {
    const v = deepGet(obj, p);
    if (v !== undefined) return v;
  }
  return undefined;
}

/**
 * Best-effort normalization. The backend schema may evolve; UI will always show raw JSON.
 */
function normalizeSuggest(raw: any): NormalizedSuggest {
  const actionsCandidate =
    firstOf(raw, [["actions"], ["next_actions"], ["suggested_actions"], ["plan"], ["data", "actions"], ["result", "actions"]]) ??
    undefined;

  const actions: NormalizedSuggest["actions"] = [];

  if (Array.isArray(actionsCandidate)) {
    for (const a of actionsCandidate) {
      if (typeof a === "string") {
        actions.push({ title: a });
      } else if (a && typeof a === "object") {
        const title = toStr(a.title) ?? toStr(a.action) ?? toStr(a.name) ?? "Action";
        const description = toStr(a.description) ?? toStr(a.desc) ?? toStr(a.details);
        const done_criteria = toStr(a.done_criteria) ?? toStr(a.doneCriteria);
        actions.push({ title, description, done_criteria });
      }
    }
  }

  const rationale =
    toStr(firstOf(raw, [["rationale"], ["reasoning"], ["analysis"], ["data", "rationale"], ["result", "rationale"]])) ?? undefined;

  const doneCriteria =
    toStr(firstOf(raw, [["done_criteria"], ["doneCriteria"], ["completion_criteria"], ["data", "done_criteria"], ["result", "done_criteria"]])) ??
    undefined;

  // report template could be under many keys; do best-effort
  const reportMarkdown =
    toStr(firstOf(raw, [["report"], ["report_template"], ["template"], ["data", "report"], ["result", "report"], ["output"]])) ?? undefined;

  return { actions, rationale, doneCriteria, reportMarkdown };
}

export function SuggestPage() {
  const { config, sessionId, lastSuggest, lastSuggestAt, suggestError, setSuggestError, setLastSuggest } = useAppStore();
  const ai = useMemo(() => makeAiClient(config.aiBaseUrl), [config.aiBaseUrl]);

  const [userMessage, setUserMessage] = useState("");
  const [memoryMode, setMemoryMode] = useState("default");
  const [historyWindow, setHistoryWindow] = useState(50);
  const [phaseOverride, setPhaseOverride] = useState("");
  const [persistPhaseOverride, setPersistPhaseOverride] = useState(false);
  const [ragFocus, setRagFocus] = useState("");

  const [busy, setBusy] = useState(false);

  async function getSuggest() {
    if (!sessionId) return;
    setBusy(true);
    setSuggestError(undefined);

    try {
      const body: SuggestRequest = {
        user_message: userMessage.trim() ? userMessage.trim() : undefined,
        memory_mode: memoryMode,
        history_window: historyWindow,
        phase_override: phaseOverride.trim() ? phaseOverride.trim() : undefined,
        persist_phase_override: persistPhaseOverride,
        rag_focus: ragFocus || undefined
      };

      const res = await ai.suggest(sessionId, body);
      setLastSuggest(res);
    } catch (e: any) {
      setSuggestError(e?.message || "Suggest failed");
    } finally {
      setBusy(false);
    }
  }

  const normalized = lastSuggest ? normalizeSuggest(lastSuggest) : null;

  return (
    <div className="page">
      <h2>Suggest</h2>

      {!sessionId ? <div className="warningBox">Set a SESSION_ID in Setup/Session page first.</div> : null}

      <div className="grid2">
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Suggest Params</div>
          </div>

          <label className="field">
            <div className="fieldLabel">User message (optional)</div>
            <textarea className="textarea" rows={4} value={userMessage} onChange={(e) => setUserMessage(e.target.value)} placeholder="Ask for next step, or provide context…" />
          </label>

          <div className="grid2">
            <label className="field">
              <div className="fieldLabel">Memory mode</div>
              <select className="select" value={memoryMode} onChange={(e) => setMemoryMode(e.target.value)}>
                <option value="default">default</option>
                <option value="full">full</option>
                <option value="summary">summary</option>
                <option value="none">none</option>
              </select>
            </label>

            <label className="field">
              <div className="fieldLabel">History window</div>
              <input className="input" type="number" min={0} value={historyWindow} onChange={(e) => setHistoryWindow(Number(e.target.value))} />
            </label>
          </div>

          <label className="field">
            <div className="fieldLabel">Phase override (optional)</div>
            <input className="input" value={phaseOverride} onChange={(e) => setPhaseOverride(e.target.value)} placeholder="e.g. recon / exploitation / reporting …" />
          </label>

          <div className="row">
            <label className="checkbox">
              <input type="checkbox" checked={persistPhaseOverride} onChange={(e) => setPersistPhaseOverride(e.target.checked)} /> Persist phase override
            </label>
          </div>

          <label className="field">
            <div className="fieldLabel">RAG focus</div>
            <select className="select" value={ragFocus} onChange={(e) => setRagFocus(e.target.value)}>
              <option value="">(default)</option>
              <option value="report">report</option>
            </select>
          </label>

          <button className="btn" onClick={getSuggest} disabled={!sessionId || busy}>
            {busy ? "Loading…" : "Get Suggest"}
          </button>

          {suggestError ? <div className="errorBox">{suggestError}</div> : null}
          {lastSuggestAt ? <div className="muted">Last suggest: {new Date(lastSuggestAt).toLocaleString()}</div> : null}
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Structured View</div>
          </div>

          {!normalized ? (
            <div className="muted">No suggest yet.</div>
          ) : (
            <>
              {normalized.actions.length > 0 ? (
                <div className="panel">
                  <div className="panelHeader">
                    <div className="panelTitle">Actions</div>
                  </div>
                  <ol className="list">
                    {normalized.actions.map((a, idx) => (
                      <li key={idx} className="listItem">
                        <div className="listTitle">{a.title}</div>
                        {a.description ? <div className="muted">{a.description}</div> : null}
                        {a.done_criteria ? (
                          <div className="muted" style={{ marginTop: 6 }}>
                            <b>Done criteria:</b> {a.done_criteria}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <div className="muted">No recognizable “actions” field. See raw JSON below.</div>
              )}

              {normalized.rationale ? (
                <div className="panel">
                  <div className="panelHeader">
                    <div className="panelTitle">Rationale</div>
                  </div>
                  <pre className="codeBlock" style={{ whiteSpace: "pre-wrap" }}>{normalized.rationale}</pre>
                </div>
              ) : null}

              {normalized.doneCriteria ? (
                <div className="panel">
                  <div className="panelHeader">
                    <div className="panelTitle">Done criteria</div>
                  </div>
                  <pre className="codeBlock" style={{ whiteSpace: "pre-wrap" }}>{normalized.doneCriteria}</pre>
                </div>
              ) : null}

              {ragFocus === "report" && normalized.reportMarkdown ? <MarkdownPanel title="Report template (best-effort)" markdown={normalized.reportMarkdown} /> : null}
            </>
          )}
        </div>
      </div>

      {lastSuggest ? <JsonPanel title="Raw suggest JSON" data={lastSuggest} /> : null}
    </div>
  );
}
