"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, CircleAlert, FileText, RefreshCw, Send } from "lucide-react";

type Draft = { id: string; title: string; body: string; created_at: string; provenance?: { kind?: string; status?: string } };

export default function CommunicationsWorkbench() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/agents/tools/execute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentKey: "communications", toolKey: "knowledge_read", args: {} }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load drafts.");
      const records = Array.isArray(data.result?.records) ? data.result.records as Draft[] : [];
      setDrafts(records.filter(item => item.provenance?.kind === "unsent_communication_draft"));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load drafts."); }
    finally { setLoading(false); }
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/agents/drafts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentKey: "communications", title, body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Draft could not be saved.");
      setTitle(""); setBody("");
      setNotice("Draft saved privately. It has NOT been sent.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Draft could not be saved."); }
    finally { setSaving(false); }
  }

  return <div style={{ maxWidth: 900, marginTop: 26, display: "grid", gap: 14 }}>
    <section className="panel">
      <div className="panel-head"><div><div className="panel-title">Communications draft studio</div><div className="panel-sub">Create and store unsent messages, email drafts and professional replies. Sending is not connected.</div></div><span className="agent-icon"><FileText size={17}/></span></div>
      <form onSubmit={save} style={{ display: "grid", gap: 11 }}>
        <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--muted)" }}>Draft title
          <input required maxLength={300} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Reply to project partner" style={{ minHeight: 40, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, background: "#0b1322", color: "var(--text)" }}/>
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--muted)" }}>Message content
          <textarea required maxLength={12000} rows={7} value={body} onChange={e => setBody(e.target.value)} placeholder="Write or paste a message draft…" style={{ width: "100%", padding: 12, border: "1px solid var(--line)", borderRadius: 8, background: "#0b1322", color: "var(--text)", resize: "vertical" }}/>
        </label>
        <div style={{ display: "flex", justifyContent: "flex-end" }}><button type="submit" disabled={saving || !title.trim() || !body.trim()} style={{ display: "inline-flex", alignItems: "center", gap: 7, minHeight: 40, padding: "0 14px", border: 0, borderRadius: 8, background: "var(--mint)", color: "#092018", fontWeight: 700, fontSize: 11 }}><Send size={14}/>{saving ? "Saving…" : "Save unsent draft"}</button></div>
      </form>
    </section>
    {notice ? <div role="status" style={{ display: "flex", gap: 7, color: "var(--mint)", fontSize: 11 }}><CheckCircle2 size={14}/>{notice}</div> : null}
    {error ? <div role="alert" style={{ display: "flex", gap: 7, color: "#f49a9a", fontSize: 11 }}><CircleAlert size={14}/>{error}</div> : null}
    <section className="panel">
      <div className="panel-head"><div><div className="panel-title">Private unsent drafts</div><div className="panel-sub">Stored in your owner-only knowledge library</div></div>
        <button type="button" onClick={() => void refresh()} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", background: "transparent", color: "var(--text)", fontSize: 10 }}><RefreshCw size={12}/>{loading ? "Loading…" : "Refresh"}</button>
      </div>
      {drafts.length ? drafts.map(draft => <article key={draft.id} className="task-row" style={{ display: "block" }}>
        <div className="task-name">{draft.title}</div><div className="task-meta" style={{ marginTop: 5 }}>UNSENT · {new Date(draft.created_at).toLocaleString()}</div>
        <p className="panel-sub" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 8 }}>{draft.body}</p>
      </article>) : <p className="panel-sub">No drafts loaded. Select Refresh to retrieve saved drafts.</p>}
    </section>
  </div>;
}
