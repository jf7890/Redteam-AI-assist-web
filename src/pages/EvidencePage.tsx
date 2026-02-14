import { useMemo, useState } from "react";
import { makeAiClient } from "../api/ai";
import type { SessionEvent, SuggestRequest } from "../api/types";
import { JsonPanel } from "../components/JsonPanel";
import { MarkdownPanel } from "../components/MarkdownPanel";
import { useAppStore } from "../state/useAppStore";

function toIsoNow() {
  return new Date().toISOString();
}

export function EvidencePage() {
  const { config, sessionId, session, setSession, sessionError, setSessionError, addLocalNote, localNotes } = useAppStore();
  const ai = useMemo(() => makeAiClient(config.aiBaseUrl), [config.aiBaseUrl]);

  const [noteText, setNoteText] = useState("");
  const [busy, setBusy] = useState<null | "note" | "refresh" | "report">(null);
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [reportRaw, setReportRaw] = useState<any>(null);
  const [reportError, setReportError] = useState<string | null>(null);

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

  async function addNote() {
    if (!sessionId) return;
    const text = noteText.trim();
    if (!text) return;

    setBusy("note");
    setSessionError(undefined);

    // Keep a local copy for convenience (even if server doesn't expose an events list).
    addLocalNote(text);

    try {
      const ev: SessionEvent = {
        event_type: "note",
        timestamp: toIsoNow(),
        payload: { text }
      };

      await ai.addEvents(sessionId, { events: [ev] });
      setNoteText("");
    } catch (e: any) {
      setSessionError(e?.message || "Failed to post note event");
    } finally {
      setBusy(null);
    }
  }

  async function getReportTemplate() {
    if (!sessionId) return;
    setBusy("report");
    setReportError(null);

    try {
      const body: SuggestRequest = {
        memory_mode: "default",
        history_window: 50,
        rag_focus: "report"
      };

      const res = await ai.suggest(sessionId, body);
      setReportRaw(res);

      // Best-effort: try to locate a markdown-ish field
      const markdown =
        (typeof res?.report === "string" && res.report) ||
        (typeof res?.report_template === "string" && res.report_template) ||
        (typeof res?.template === "string" && res.template) ||
        (typeof res?.output === "string" && res.output) ||
        null;

      setReportMarkdown(markdown);
    } catch (e: any) {
      setReportError(e?.message || "Failed to get report template");
    } finally {
      setBusy(null);
    }
  }

  const sessionEvents = Array.isArray(session?.events) ? session!.events : [];

  return (
    <div className="page">
      <h2>Evidence / Notes / Report</h2>

      {!sessionId ? <div className="warningBox">Set a SESSION_ID in Setup/Session page first.</div> : null}

      <div className="grid2">
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Add Note (POST events)</div>
          </div>

          <label className="field">
            <div className="fieldLabel">Note</div>
            <textarea className="textarea" rows={4} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="What did you try? What did you observe? URLs, creds, findings…" />
          </label>

          <div className="row">
            <button className="btn" onClick={addNote} disabled={!sessionId || busy !== null || !noteText.trim()}>
              {busy === "note" ? "Posting…" : "Add note"}
            </button>
            <button className="btn btn-secondary" onClick={refreshSession} disabled={!sessionId || busy !== null}>
              {busy === "refresh" ? "Refreshing…" : "Refresh session"}
            </button>
          </div>

          {sessionError ? <div className="errorBox">{sessionError}</div> : null}
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Report Template (rag_focus=report)</div>
          </div>

          <button className="btn" onClick={getReportTemplate} disabled={!sessionId || busy !== null}>
            {busy === "report" ? "Generating…" : "Get report template"}
          </button>

          {reportError ? <div className="errorBox">{reportError}</div> : null}

          {reportMarkdown ? <MarkdownPanel title="Report template (best-effort)" markdown={reportMarkdown} /> : null}

          {reportRaw ? <JsonPanel title="Raw report suggest JSON" data={reportRaw} /> : null}
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Timeline (best-effort)</div>
          </div>

          {sessionEvents.length === 0 ? (
            <div className="muted">
              No <code>session.events</code> found in <code>GET /v1/sessions/{sessionId}</code>.
              <br />
              The UI will still show notes you added locally below. If you need a full timeline, consider exposing an events list endpoint.
            </div>
          ) : (
            <ol className="list">
              {sessionEvents.map((ev, idx) => (
                <li key={ev.event_id ?? idx} className="listItem">
                  <div className="listTitle">
                    {ev.event_type} <span className="muted">• {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : "no timestamp"}</span>
                  </div>
                  <pre className="codeBlock">{JSON.stringify(ev.payload, null, 2)}</pre>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Notes entered from this UI (local)</div>
          </div>

          {localNotes.length === 0 ? (
            <div className="muted">No local notes yet.</div>
          ) : (
            <ol className="list">
              {localNotes.map((n) => (
                <li key={n.id} className="listItem">
                  <div className="listTitle">
                    note <span className="muted">• {new Date(n.timestamp).toLocaleString()}</span>
                  </div>
                  <pre className="codeBlock" style={{ whiteSpace: "pre-wrap" }}>{n.text}</pre>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {session ? <JsonPanel title="Raw session JSON (if loaded)" data={session} /> : null}
    </div>
  );
}
