"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, RefreshCw } from "lucide-react";

type ActivityEvent = {
  id: string;
  actor_type: string;
  event_type: string;
  resource_type: string | null;
  summary: string;
  created_at: string;
};

export default function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/activity", { cache: "no-store" });
      const payload = await response.json() as { events?: ActivityEvent[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Activity could not be loaded.");
      setEvents(Array.isArray(payload.events) ? payload.events : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Activity could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <section className="panel" style={{ marginTop: 28, maxWidth: 900 }}>
      <div className="panel-head">
        <div>
          <div className="panel-title">Workspace activity</div>
          <div className="panel-sub">Owner-scoped, append-only event journal · latest 100 events</div>
        </div>
        <button type="button" className="icon-button" onClick={() => void load()} aria-label="Refresh activity" disabled={loading}>
          <RefreshCw size={14} />
        </button>
      </div>
      {loading ? <p className="panel-sub">Loading activity…</p> : error ? (
        <div className="preview-inline"><AlertCircle size={15}/><span>{error}</span></div>
      ) : events.length === 0 ? (
        <div className="public-page-note" style={{ padding: "18px 0 4px" }}>
          <p>No activity has been recorded yet. Creating or updating a project or task will add an event here.</p>
        </div>
      ) : events.map((event) => (
        <div className="task-row" key={event.id}>
          <span className="agent-icon"><Activity size={14}/></span>
          <div style={{ minWidth: 0 }}>
            <div className="task-name">{event.summary}</div>
            <div className="task-meta">{event.actor_type.toUpperCase()} · {event.event_type.replaceAll(".", " ").toUpperCase()} · {event.resource_type || "SYSTEM"}</div>
          </div>
          <time className="priority" dateTime={event.created_at}>
            {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kathmandu" }).format(new Date(event.created_at))}
          </time>
        </div>
      ))}
    </section>
  );
}
