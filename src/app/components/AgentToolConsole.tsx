"use client";

import { useState } from "react";
import { Activity, CheckCircle2, CircleAlert, Play, ShieldCheck } from "lucide-react";
import type { AgentDefinition } from "@/lib/agents/registry";

type ReadTool = "project_read" | "task_read" | "github_read" | "knowledge_read";
type ToolResult = { runId: string; tool: string; result: unknown };

const availableTools: ReadTool[] = ["project_read", "task_read", "github_read", "knowledge_read"];
const labels: Record<ReadTool, string> = {
  project_read: "Read projects",
  task_read: "Read tasks",
  github_read: "Read GitHub",
  knowledge_read: "Read knowledge",
};

export default function AgentToolConsole({ agents }: { agents: AgentDefinition[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ToolResult>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function runTool(agentKey: string, toolKey: ReadTool) {
    const key = agentKey + ":" + toolKey;
    setLoading(key);
    setErrors((current) => ({ ...current, [key]: "" }));
    try {
      const response = await fetch("/api/agents/tools/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentKey, toolKey, args: {} }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Agent tool execution failed.");
      setResults((current) => ({ ...current, [key]: data as ToolResult }));
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [key]: error instanceof Error ? error.message : "Agent tool execution failed.",
      }));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12, marginTop: 26 }}>
      {agents.map((agent) => {
        const tools = availableTools.filter((tool) => agent.tools.includes(tool));
        return (
          <section className="panel" key={agent.key}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div className="panel-title">{agent.name}</div>
              <span className="priority" style={{ color: tools.length ? "#9bf0c7" : "#91baff" }}>
                {tools.length ? "READ TOOLS READY" : agent.autonomy.replaceAll("_", " ").toUpperCase()}
              </span>
            </div>
            <p className="panel-sub" style={{ lineHeight: 1.7, marginTop: 10 }}>{agent.mission}</p>
            <div className="task-meta" style={{ marginTop: 12 }}>CAPABILITIES</div>
            {agent.capabilities.map((cap) => <div className="task-meta" key={cap} style={{ marginTop: 6 }}>· {cap}</div>)}
            <div className="task-meta" style={{ marginTop: 12 }}>TOOL ACCESS</div>
            {tools.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
                {tools.map((tool) => {
                  const key = agent.key + ":" + tool;
                  const busy = loading === key;
                  return (
                    <button key={tool} type="button" onClick={() => void runTool(agent.key, tool)} disabled={Boolean(loading)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", background: "rgba(155,240,199,.07)", color: "var(--text)", fontSize: 10, cursor: "pointer" }}>
                      {busy ? <Activity size={12} /> : <Play size={11} />}
                      {busy ? "Running…" : labels[tool]}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="task-meta" style={{ marginTop: 7 }}>No executable adapter enabled yet. This role remains in development.</p>
            )}
            {tools.map((tool) => {
              const key = agent.key + ":" + tool;
              const result = results[key];
              const error = errors[key];
              return (
                <div key={tool}>
                  {error ? <div role="alert" style={{ display: "flex", gap: 7, marginTop: 10, color: "#f49a9a", fontSize: 10 }}><CircleAlert size={13} />{error}</div> : null}
                  {result ? (
                    <div style={{ marginTop: 10, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--mint)", fontSize: 10 }}><CheckCircle2 size={13} />Completed · {result.runId.slice(0, 8)}</div>
                      <pre style={{ marginTop: 8, maxHeight: 220, overflow: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 10, lineHeight: 1.6, color: "var(--muted)" }}>{JSON.stringify(result.result, null, 2)}</pre>
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, color: "var(--muted)", fontSize: 9 }}>
              <ShieldCheck size={12} /> Owner-scoped · read-only · execution recorded
            </div>
          </section>
        );
      })}
    </div>
  );
}
