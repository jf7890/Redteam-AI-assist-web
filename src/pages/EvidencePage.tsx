import React, { useMemo, useState } from "react";
import { makeAiClient } from "../api/ai";
import type { ActivityEvent, EventType, SessionRecord, SuggestResponse } from "../api/types";
import { JsonPanel } from "../components/JsonPanel";
import { MarkdownPanel } from "../components/MarkdownPanel";
import { useAppStore } from "../state/useAppStore";

function formatTs(ts?: string) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

function eventTitle(e: ActivityEvent) {
  if (e.event_type === "command" && e.payload?.command) return e.payload.command;
  if (e.event_type === "http" && e.payload?.url) return `${e.payload.method || "GET"} ${e.payload.url}`;
  if (e.event_type === "note" && (e.payload?.note || e.payload?.text)) return String(e.payload.note || e.payload.text);
  return "";
}

export function EvidencePage() {
  const cfg = useAppStore((s) => s.config);
  const sessionId = useAppStore((s) => s.sessionId);

  const ai = useMemo(() => makeAiClient(cfg.aiBaseUrl), [cfg.aiBaseUrl]);

  const [note, setNote] = useState("");
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");

  const [filter, setFilter] = useState<string>("all");

  const [reportResp, setReportResp] = useState<SuggestResponse | null>(null);

  async function refresh() {
    if (!sessionId) {
      setErr("Missing SESSION_ID. Go to Session page → Create/Load session first.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const s = await ai.getSession(sessionId);
      setSession(s);
    } catch (e: any) {
      setErr(e?.message || String(e));
      setSession(null);
    } finally {
      setBusy(false);
    }
  }

  async function addNote() {
    if (!sessionId) {
      setErr("Missing SESSION_ID. Go to Session page → Create/Load session first.");
      return;
    }
    if (!note.trim()) return;

    setErr("");
    setBusy(true);
    try {
      const updated = await ai.ingestEvents(sessionId, {
        events: [
          {
            event_type: "note",
            payload: {
              note: note.trim(),
              source: "webui"
            }
          }
        ]
      });
      setSession(updated);
      setNote("");
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function fetchReportTemplate() {
    if (!sessionId) {
      setErr("Missing SESSION_ID. Go to Session page → Create/Load session first.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const r = await ai.suggest(sessionId, { rag_focus: "report" });
      setReportResp(r);
    } catch (e: any) {
      setErr(e?.message || String(e));
      setReportResp(null);
    } finally {
      setBusy(false);
    }
  }

  const events = (session?.events || []).slice().sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta; // newest first
  });

  const filtered = filter === "all" ? events : events.filter((e) => e.event_type === filter);

  return (
    <>
      <h2>Evidence / Notes</h2>

      {err && <div className="error">{err}</div>}

      <div className="card">
        <div className="row">
          <div>
            <label>Add note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write observation / evidence note..." />
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button onClick={addNote} disabled={busy || !note.trim()}>
                Add note (POST /events)
              </button>
              <button className="secondary" onClick={refresh} disabled={busy}>
                Refresh Session
              </button>
            </div>
          </div>
          <div>
            <label>Report template</label>
            <div className="muted">
              Nút này gọi <span className="mono">/suggest</span> với <span className="mono">rag_focus=report</span> rồi render
              nội dung từ <span className="mono">retrieved_context</span>.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button className="secondary" onClick={fetchReportTemplate} disabled={busy || !sessionId}>
                Export report template
              </button>
            </div>
          </div>
        </div>
      </div>

      {reportResp && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Report template (retrieved_context)</h3>
          {reportResp.retrieved_context?.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {reportResp.retrieved_context.map((c, idx) => (
                <div key={idx} className="card" style={{ marginBottom: 0 }}>
                  <div className="muted">
                    <span className="mono">{c.source}</span> · score {c.score.toFixed(3)}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <MarkdownPanel content={c.content} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No retrieved context.</div>
          )}
          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ marginBottom: 6 }}>Raw JSON</div>
            <JsonPanel value={reportResp} />
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Timeline events</h3>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span className="muted">Filter:</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">all</option>
            <option value="command">command</option>
            <option value="http">http</option>
            <option value="scan">scan</option>
            <option value="note">note</option>
            <option value="system">system</option>
          </select>

          <span className="muted" style={{ marginLeft: "auto" }}>
            events: <span className="mono">{events.length}</span>
          </span>
        </div>

        {!session ? (
          <div className="muted" style={{ marginTop: 10 }}>
            (Chưa load session) Bấm <b>Refresh Session</b> để xem timeline.
          </div>
        ) : filtered.length === 0 ? (
          <div className="muted" style={{ marginTop: 10 }}>No events.</div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {filtered.map((e) => (
              <div key={e.event_id || Math.random()} className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span className="pill">{e.event_type}</span>
                  <span className="muted">{formatTs(e.timestamp)}</span>
                  <span className="mono" style={{ fontSize: 12 }}>{e.event_id || ""}</span>
                </div>
                {eventTitle(e) && (
                  <div style={{ marginTop: 8 }}>
                    <b className="mono" style={{ fontSize: 13 }}>{eventTitle(e)}</b>
                  </div>
                )}
                <div style={{ marginTop: 10 }}>
                  <JsonPanel value={e.payload} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {session && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Session (raw)</h3>
          <JsonPanel value={session} />
        </div>
      )}
    </>
  );
}
