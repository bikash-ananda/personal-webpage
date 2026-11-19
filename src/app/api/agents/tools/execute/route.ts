import { NextResponse } from "next/server";
import { pool } from "@/lib/auth";
import { getAgent } from "@/lib/agents/registry";
import { evaluateToolRequest } from "@/lib/agents/runtime";
import { getOwnerContext, hasTrustedMutationOrigin } from "@/lib/server/owner";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };
const GITHUB_REPOSITORY = "bikash-ananda/personal-webpage";

type ToolKey = "project_read" | "task_read" | "github_read" | "knowledge_read" | "encyclopedia_search";

function isEmptyRecord(value: unknown): value is Record<string, never> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype
    && Object.keys(value).length === 0);
}

async function executeReadOnlyTool(toolKey: ToolKey, ownerId: string, args: Record<string, unknown>) {
  if (toolKey === "encyclopedia_search") {
    const query = typeof args.query === "string" ? args.query.trim() : "";
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "search");
    url.searchParams.set("srsearch", query);
    url.searchParams.set("srlimit", "8");
    url.searchParams.set("format", "json");
    url.searchParams.set("utf8", "1");
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "PersonalOSResearchAgent/1.0 (private research workspace)" },
      cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("The public encyclopedia search is temporarily unavailable.");
    const data = await response.json() as { query?: { search?: Array<{ pageid: number; title: string; snippet: string; wordcount: number; timestamp: string }> } };
    const results = (data.query?.search ?? []).slice(0, 8).map(item => ({
      title: item.title,
      url: "https://en.wikipedia.org/?curid=" + item.pageid,
      snippet: item.snippet.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&"),
      wordCount: item.wordcount,
      updatedAt: item.timestamp,
    }));
    return { provider: "English Wikipedia", query, count: results.length, results, limitation: "Initial source discovery only; verify important claims against primary research, official documents and multiple independent sources." };
  }

  if (toolKey === "knowledge_read") {
    const result = await pool.query(
      `SELECT id, project_id, title, body, content_type, source_uri, sensitivity, provenance, tags, created_at, updated_at
       FROM personal_knowledge WHERE owner_id=$1 AND deleted_at IS NULL
       ORDER BY updated_at DESC LIMIT 100`,
      [ownerId]
    );
    return { count: result.rowCount ?? 0, records: result.rows };
  }

  if (toolKey === "project_read") {
    const result = await pool.query(
      `SELECT id, name, summary, status, priority, updated_at
       FROM personal_projects
       WHERE owner_id = $1 AND archived_at IS NULL
       ORDER BY updated_at DESC LIMIT 50`,
      [ownerId]
    );
    return { count: result.rowCount ?? 0, projects: result.rows };
  }

  if (toolKey === "task_read") {
    const result = await pool.query(
      `SELECT t.id, t.title, t.description, t.status, t.priority, t.due_at,
              p.name AS project_name, t.updated_at
       FROM personal_tasks t
       LEFT JOIN personal_projects p ON p.id = t.project_id AND p.owner_id = t.owner_id
       WHERE t.owner_id = $1
       ORDER BY t.updated_at DESC LIMIT 50`,
      [ownerId]
    );
    return { count: result.rowCount ?? 0, tasks: result.rows };
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Bikash-Personal-OS-ReadOnly-Agent",
  };
  if (process.env.GITHUB_READONLY_TOKEN) {
    headers.Authorization = "Bearer " + process.env.GITHUB_READONLY_TOKEN;
  }
  const response = await fetch("https://api.github.com/repos/" + GITHUB_REPOSITORY, {
    headers, cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("The allowlisted GitHub repository could not be read.");
  const repo = await response.json() as {
    full_name: string; html_url: string; description: string | null;
    default_branch: string; private: boolean; updated_at: string;
    open_issues_count: number; stargazers_count: number;
  };
  const commitsResponse = await fetch(
    "https://api.github.com/repos/" + GITHUB_REPOSITORY + "/commits?per_page=5",
    { headers, cache: "no-store", signal: AbortSignal.timeout(8000) }
  );
  if (!commitsResponse.ok) throw new Error("GitHub repository metadata loaded, but recent commits could not be read.");
  const commits = await commitsResponse.json() as Array<{
    sha: string; html_url: string; commit: { message: string; author: { date: string } | null };
  }>;
  return {
    repository: {
      name: repo.full_name, url: repo.html_url, description: repo.description,
      defaultBranch: repo.default_branch, private: repo.private,
      updatedAt: repo.updated_at, openIssues: repo.open_issues_count, stars: repo.stargazers_count,
    },
    recentCommits: commits.slice(0, 5).map((item) => ({
      sha: item.sha.slice(0, 7), url: item.html_url,
      message: item.commit.message.split("\n")[0].slice(0, 180),
      date: item.commit.author?.date ?? null,
    })),
  };
}

export async function POST(request: Request) {
  if (!hasTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403, headers: noStore });
  }
  const owner = await getOwnerContext();
  if (!owner.ok) {
    return NextResponse.json({ error: owner.error }, { status: owner.status, headers: noStore });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "A valid JSON body is required." }, { status: 400, headers: noStore }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid agent tool request." }, { status: 400, headers: noStore });
  }

  const input = body as Record<string, unknown>;
  const agentKey = typeof input.agentKey === "string" ? input.agentKey : "";
  const toolKey = typeof input.toolKey === "string" ? input.toolKey : "";
  const agent = getAgent(agentKey);
  const typedTool = toolKey as ToolKey;
  const args = input.args && typeof input.args === "object" && !Array.isArray(input.args)
    ? input.args as Record<string, unknown> : null;
  const validReadTool = ["project_read", "task_read", "github_read", "knowledge_read"].includes(toolKey);
  const validSearchTool = toolKey === "encyclopedia_search" && args !== null
    && Object.keys(args).length === 1 && typeof args.query === "string"
    && args.query.trim().length >= 2 && args.query.trim().length <= 180;
  if (!agent || !["project_read", "task_read", "github_read", "knowledge_read", "encyclopedia_search"].includes(toolKey)
      || !args || (validReadTool && !isEmptyRecord(args)) || (!validReadTool && !validSearchTool)) {
    return NextResponse.json({ error: "Unknown agent/tool or invalid arguments. Search requires one query between 2 and 180 characters; other read tools accept no arguments." }, { status: 400, headers: noStore });
  }

  const target = typedTool === "github_read" ? GITHUB_REPOSITORY
    : typedTool === "encyclopedia_search" ? "en.wikipedia.org"
    : "owner_workspace";
  const decision = evaluateToolRequest({
    ownerId: owner.ownerId, agentKey, toolKey: typedTool, target, args,
  });
  if (decision.outcome !== "allow") {
    return NextResponse.json({
      error: decision.outcome === "deny" ? "This agent is not permitted to use that tool." : "This action requires a separate approval workflow.",
      decision,
    }, { status: 403, headers: noStore });
  }

  let runId: string | null = null;
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [owner.ownerId]);
      const usage = await client.query(
        "SELECT count(*)::int AS count FROM agent_runs WHERE owner_id=$1 AND created_at>now()-interval '1 hour'",
        [owner.ownerId]
      );
      if (usage.rows[0].count >= 30) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Agent run limit reached. Try again later." }, { status: 429, headers: noStore });
      }
      const run = await client.query(
        "INSERT INTO agent_runs(owner_id,agent_key,task,status,autonomy_tier,input) VALUES($1,$2,$3,'running',0,$4::jsonb) RETURNING id",
        [owner.ownerId, agentKey, "Read-only tool: " + typedTool, JSON.stringify({ toolKey: typedTool, target, args })]
      );
      runId = run.rows[0].id as string;
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }

    const result = await executeReadOnlyTool(typedTool, owner.ownerId, args);
    await pool.query(
      "UPDATE agent_runs SET status='succeeded',output=$2::jsonb,finished_at=now() WHERE id=$1 AND owner_id=$3",
      [runId, JSON.stringify({ toolKey: typedTool, target, args, result }), owner.ownerId]
    );
    return NextResponse.json({ runId, agent: agent.name, tool: typedTool, target, result }, { headers: noStore });
  } catch {
    if (runId) {
      await pool.query(
        "UPDATE agent_runs SET status='failed',error_code='read_tool_failed',finished_at=now() WHERE id=$1 AND owner_id=$2",
        [runId, owner.ownerId]
      ).catch(() => undefined);
    }
    return NextResponse.json({ error: "The read-only agent tool failed. No external changes were made." }, { status: 502, headers: noStore });
  }
}
