"use client";

import { FormEvent, useState } from "react";
import { BookOpen, CheckCircle2, CircleAlert, FilePlus2, RefreshCw, Search, ShieldCheck } from "lucide-react";

type RecordItem = { id: string; title: string; body: string; content_type: string; source_uri: string | null; sensitivity: string; tags: string[]; updated_at: string };
type PendingApproval = { approvalId: string; expiresAt: string; title: string } | null;
type SearchResult = { title: string; url: string; snippet: string; wordCount: number; updatedAt: string };

export default function KnowledgeWorkbench({ mode }: { mode: "research" | "knowledge" }) {
  const agentKey = mode === "research" ? "research" : "knowledge";
  const researchMode = mode === "research";
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sourceUri, setSourceUri] = useState("");
  const [tags, setTags] = useState("");
  const [sensitivity, setSensitivity] = useState("private");
  const [pending, setPending] = useState<PendingApproval>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function searchSources() {
    setSearching(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/agents/tools/execute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentKey: "research", toolKey: "encyclopedia_search", args: { query: searchQuery } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Source discovery failed.");
      setSearchResults(Array.isArray(data.result?.results) ? data.result.results : []);
      setNotice("Found " + (data.result?.count ?? 0) + " initial discovery sources in English Wikipedia. Verify important claims independently.");
    } catch (e) { setError(e instanceof Error ? e.message : "Source discovery failed."); }
    finally { setSearching(false); }
  }

  async function refresh() {
    setLoading(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/agents/tools/execute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentKey, toolKey: "knowledge_read", args: {} }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Knowledge retrieval failed.");
      setRecords(Array.isArray(data.result?.records) ? data.result.records : []);
      setNotice("Loaded " + (data.result?.count ?? 0) + " saved records.");
    } catch (e) { setError(e instanceof Error ? e.message : "Knowledge retrieval failed."); }
    finally { setLoading(false); }
  }

  async function propose(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError(""); setNotice(""); setPending(null);
    try {
      const response = await fetch("/api/agents/knowledge/propose", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentKey, title, body, sourceUri: sourceUri || null,
          contentType: researchMode ? "research" : "note",
          sensitivity, tags: tags.split(",").map(x => x.trim()).filter(Boolean),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create approval request.");
      setPending({ approvalId: data.approvalId, expiresAt: data.expiresAt, title });
      setNotice("A save request is waiting for your explicit approval. Nothing has been saved yet.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create approval request."); }
    finally { setSaving(false); }
  }

  async function approve() {
    if (!pending) return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/agents/knowledge/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId: pending.approvalId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Approval failed.");
      setNotice("Saved: " + data.knowledge.title);
      setPending(null); setTitle(""); setBody(""); setSourceUri(""); setTags("");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Approval failed."); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ maxWidth: 900, marginTop: 26, display: "grid", gap: 14 }}>
      {researchMode ? <section className="panel">
        <div className="panel-head"><div><div className="panel-title">Initial source discovery</div><div className="panel-sub">Free search against English Wikipedia. Verify important claims against primary studies, government sources and independent publications.</div></div><Search size={17}/></div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} maxLength={180} placeholder="Search a topic, technology or research question…" style={{ flex: 1, minWidth: 0, minHeight: 40, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, background: "#0b1322", color: "var(--text)" }}/>
          <button type="button" onClick={() => void searchSources()} disabled={searching || searchQuery.trim().length < 2} style={{ minHeight: 40, padding: "0 13px", border: 0, borderRadius: 8, background: "var(--mint)", color: "#092018", fontWeight: 700, fontSize: 11 }}>{searching ? "Searching…" : "Search"}</button>
        </div>
        {searchResults.map(result => <article key={result.url} className="task-row" style={{ display: "block" }}>
          <a href={result.url} target="_blank" rel="noreferrer" className="task-name">{result.title} ↗</a>
          <p className="panel-sub" style={{ marginTop: 6, lineHeight: 1.6 }}>{result.snippet}</p>
          <div className="task-meta">{result.wordCount} words · English Wikipedia · verify with primary sources</div>
        </article>)}
      </section> : null}
      <section className="panel">
        <div className="panel-head">
          <div><div className="panel-title">{researchMode ? "Research dossier" : "Knowledge capture"}</div>
            <div className="panel-sub">{researchMode ? "Capture research questions, source links, findings and evidence notes. This is a source-backed workspace, not an automatic web search." : "Save durable project notes and decisions with source and sensitivity metadata."}</div></div>
          <span className="agent-icon">{researchMode ? <FilePlus2 size={17}/> : <BookOpen size={17}/>}</span>
        </div>
        <form onSubmit={propose} style={{ display: "grid", gap: 11 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--muted)" }}>Title
            <input required maxLength={300} value={title} onChange={e => setTitle(e.target.value)} placeholder={researchMode ? "Research question or report title" : "Knowledge title"} style={{ minHeight: 40, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, background: "#0b1322", color: "var(--text)" }}/>
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--muted)" }}>{researchMode ? "Findings, question and evidence notes" : "Knowledge content"}
            <textarea required maxLength={20000} rows={6} value={body} onChange={e => setBody(e.target.value)} placeholder={researchMode ? "Record the research question, key findings, evidence, limitations and next steps. Keep claims linked to their sources." : "Write the decision, technical note, procedure or information to remember."} style={{ width: "100%", padding: 12, border: "1px solid var(--line)", borderRadius: 8, background: "#0b1322", color: "var(--text)", resize: "vertical" }}/>
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--muted)" }}>Source URL (optional, public HTTPS)
            <input type="url" value={sourceUri} onChange={e => setSourceUri(e.target.value)} placeholder="https://..." style={{ minHeight: 40, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, background: "#0b1322", color: "var(--text)" }}/>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--muted)" }}>Tags (comma separated)
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="AI, robotics, greenhouse" style={{ minHeight: 40, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, background: "#0b1322", color: "var(--text)" }}/>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--muted)" }}>Sensitivity
              <select value={sensitivity} onChange={e => setSensitivity(e.target.value)} style={{ minHeight: 40, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 8, background: "#0b1322", color: "var(--text)" }}>
                <option value="normal">Normal</option><option value="private">Private</option><option value="sensitive">Sensitive</option><option value="restricted">Restricted</option>
              </select>
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={saving || !title.trim() || !body.trim()} style={{ display: "inline-flex", alignItems: "center", gap: 7, minHeight: 40, padding: "0 14px", border: 0, borderRadius: 8, background: "var(--mint)", color: "#092018", fontWeight: 700, fontSize: 11 }}>
              <ShieldCheck size={14}/>{saving ? "Submitting…" : "Submit for approval"}
            </button>
          </div>
        </form>
      </section>
      {pending ? <section className="panel" style={{ borderColor: "rgba(244,200,121,.35)" }}>
        <div className="panel-title">Owner approval required</div>
        <p className="panel-sub" style={{ marginTop: 8 }}>Exact record: <strong>{pending.title}</strong>. The payload is bound to this approval and expires at {new Date(pending.expiresAt).toLocaleString()}.</p>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button type="button" disabled={saving} onClick={() => void approve()} style={{ display: "inline-flex", alignItems: "center", gap: 7, minHeight: 40, padding: "0 14px", border: 0, borderRadius: 8, background: "var(--mint)", color: "#092018", fontWeight: 700, fontSize: 11 }}><CheckCircle2 size={14}/>{saving ? "Approving…" : "Approve exact record & save"}</button>
        </div>
      </section> : null}
      {error ? <div role="alert" style={{ display: "flex", gap: 8, color: "#f49a9a", fontSize: 11 }}><CircleAlert size={14}/>{error}</div> : null}
      {notice ? <div role="status" style={{ color: "var(--mint)", fontSize: 11 }}>{notice}</div> : null}
      <section className="panel">
        <div className="panel-head"><div><div className="panel-title">Saved {researchMode ? "research records" : "knowledge records"}</div><div className="panel-sub">Owner-scoped records with provenance and sensitivity metadata</div></div>
          <button type="button" onClick={() => void refresh()} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", background: "transparent", color: "var(--text)", fontSize: 10 }}><RefreshCw size={12}/>{loading ? "Loading…" : "Refresh"}</button>
        </div>
        {records.length ? records.filter(r => researchMode ? r.content_type === "research" : true).map(record => (
          <article key={record.id} className="task-row" style={{ display: "block" }}>
            <div className="task-name">{record.title}</div>
            <div className="task-meta" style={{ marginTop: 5 }}>{record.content_type.toUpperCase()} · {record.sensitivity.toUpperCase()} · {new Date(record.updated_at).toLocaleString()}</div>
            <p className="panel-sub" style={{ whiteSpace: "pre-wrap", lineHeight: 1.65, marginTop: 8 }}>{record.body}</p>
            {record.source_uri ? <a href={record.source_uri} target="_blank" rel="noreferrer" className="text-link">OPEN SOURCE ↗</a> : null}
          </article>
        )) : <p className="panel-sub">No records loaded yet. Select Refresh to retrieve your saved items.</p>}
      </section>
    </div>
  );
}
