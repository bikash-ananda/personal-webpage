"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CheckCircle2, CircleAlert, Github, KeyRound, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";

type Provider = { id: string; model: string; kind: "local" | "hosted"; status: string };
type ProviderResponse = { configuredCount: number; externalProvidersAllowed: boolean; providers: Provider[]; error?: string };
type GitHubResponse = {
  configured?: boolean;
  connected?: boolean;
  permission?: string;
  repository?: { name: string; url: string; description: string | null; defaultBranch: string; stars: number; openIssuesAndPullRequests: number; private: boolean; updatedAt: string };
  recentCommits?: Array<{ sha: string; url: string; message: string; author: string; date: string | null }>;
  error?: string;
};

const providerNames: Record<string, string> = {
  ollama: "Ollama (local)",
  gemini: "Google Gemini",
  groq: "Groq",
  openrouter: "OpenRouter",
  cloudflare: "Cloudflare Workers AI",
  nvidia: "NVIDIA NIM",
};

export default function IntegrationManager() {
  const [providers, setProviders] = useState<ProviderResponse | null>(null);
  const [github, setGithub] = useState<GitHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [providerResponse, githubResponse] = await Promise.all([
        fetch("/api/ai/providers", { cache: "no-store" }),
        fetch("/api/integrations/github", { cache: "no-store" }),
      ]);
      const providerData = await providerResponse.json() as ProviderResponse;
      const githubData = await githubResponse.json() as GitHubResponse;
      if (!providerResponse.ok) throw new Error(providerData.error || "Could not load AI provider status.");
      setProviders(providerData);
      setGithub(githubData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Integration status could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
    <section className="panel">
      <div className="panel-head">
        <div><div className="panel-title">AI model providers</div><div className="panel-sub">Free-first · no automatic paid fallback · credentials never shown</div></div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="text-link" style={{ background: "transparent", border: 0, cursor: "pointer" }}><RefreshCw size={12} style={{ display: "inline", marginRight: 5 }} />REFRESH</button>
      </div>
      {loading && <p className="panel-sub">Checking configured providers…</p>}
      {error && <p className="panel-sub" role="alert" style={{ color: "#f4c879" }}>{error}</p>}
      {providers && <>
        <div className="task-meta" style={{ margin: "8px 0 14px" }}>{providers.configuredCount} CONFIGURED · EXTERNAL PROVIDERS {providers.externalProvidersAllowed ? "ALLOWED BY OWNER CONFIG" : "DISABLED"}</div>
        {providers.providers.length === 0
          ? <div className="preview-inline"><Sparkles size={15} /><span>No model is configured yet. The app remains usable without a paid API. Local Ollama or an explicitly enabled free-tier provider can be added later.</span></div>
          : providers.providers.map((provider) => <div className="agent-row" key={provider.id}>
            <span className="agent-icon">{provider.kind === "local" ? <Activity size={15} /> : <Sparkles size={15} />}</span>
            <div style={{ minWidth: 0 }}><div className="agent-name">{providerNames[provider.id] || provider.id}</div><div className="agent-desc">{provider.model} · {provider.kind.toUpperCase()}</div></div>
            <span className="agent-state"><CheckCircle2 size={12} style={{ display: "inline", marginRight: 4 }} />CONFIGURED</span>
          </div>)}
      </>}
      <div className="preview-inline" style={{ marginTop: 14 }}><ShieldCheck size={15} /><span>Configured means credentials and model settings exist; it does not mean the provider has passed a live inference or quota check.</span></div>
    </section>

    <section className="panel">
      <div className="panel-head">
        <div><div className="panel-title">GitHub · read-only</div><div className="panel-sub">Repository metadata and latest commits · no write permissions</div></div>
        <Github size={18} color="#63f2dc" />
      </div>
      {!github && !loading && <div className="preview-inline"><CircleAlert size={15} /><span>GitHub status is not available. Use refresh to retry.</span></div>}
      {github?.connected && github.repository && <>
        <div className="agent-row">
          <span className="agent-icon"><Github size={15} /></span>
          <div style={{ minWidth: 0 }}><a className="agent-name" href={github.repository.url} target="_blank" rel="noreferrer">{github.repository.name}</a><div className="agent-desc">{github.repository.description || "Personal AI OS source repository"}</div></div>
          <span className="agent-state"><CheckCircle2 size={12} style={{ display: "inline", marginRight: 4 }} />CONNECTED</span>
        </div>
        <div className="stats" style={{ marginTop: 14 }}>
          <div className="stat"><div className="stat-head">Default branch</div><div className="stat-value" style={{ fontSize: 19 }}>{github.repository.defaultBranch}</div></div>
          <div className="stat"><div className="stat-head">Stars</div><div className="stat-value" style={{ fontSize: 19 }}>{github.repository.stars}</div></div>
          <div className="stat"><div className="stat-head">Open issues / PRs</div><div className="stat-value" style={{ fontSize: 19 }}>{github.repository.openIssuesAndPullRequests}</div></div>
        </div>
        <div className="task-meta" style={{ margin: "18px 0 8px" }}>LATEST COMMITS</div>
        {github.recentCommits?.map((commit) => <div className="task-row" key={commit.sha}>
          <div style={{ minWidth: 0, flex: 1 }}><a className="task-name" href={commit.url} target="_blank" rel="noreferrer">{commit.message}</a><div className="task-meta">{commit.sha} · {commit.author}{commit.date ? " · " + new Date(commit.date).toLocaleString() : ""}</div></div>
        </div>)}
        <div className="preview-inline" style={{ marginTop: 12 }}><ShieldCheck size={15} /><span>Read-only access only. No repository files are executed, no commits are created, and no issues or pull requests are modified.</span></div>
      </>}
      {github && !github.connected && <div className="preview-inline"><CircleAlert size={15} /><span>{github.error || "GitHub is not connected."}</span></div>}
      <div className="task-meta" style={{ marginTop: 12 }}><KeyRound size={11} style={{ display: "inline", marginRight: 5 }} />A token is optional for public repositories. If needed, use a fine-grained token limited to metadata and contents: read-only.</div>
    </section>
  </div>;
}
