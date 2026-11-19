import { NextResponse } from "next/server";
import { pool } from "@/lib/auth";
import { createActionDigest, evaluateToolRequest } from "@/lib/agents/runtime";
import { getAgent } from "@/lib/agents/registry";
import { getOwnerContext, hasTrustedMutationOrigin } from "@/lib/server/owner";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };
const contentTypes = ["note", "document", "url", "conversation", "research", "file"] as const;
const sensitivities = ["normal", "private", "sensitive", "restricted"] as const;

export async function POST(request: Request) {
  if (!hasTrustedMutationOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403, headers: noStore });
  const owner = await getOwnerContext();
  if (!owner.ok) return NextResponse.json({ error: owner.error }, { status: owner.status, headers: noStore });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "A valid JSON body is required." }, { status: 400, headers: noStore }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid knowledge record." }, { status: 400, headers: noStore });
  const input = body as Record<string, unknown>;
  const agentKey = typeof input.agentKey === "string" ? input.agentKey : "knowledge";
  const agent = getAgent(agentKey);
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const content = typeof input.body === "string" ? input.body.trim() : "";
  const contentType = contentTypes.includes(input.contentType as typeof contentTypes[number]) ? input.contentType as string : "note";
  const sensitivity = sensitivities.includes(input.sensitivity as typeof sensitivities[number]) ? input.sensitivity as string : "private";
  const projectId = typeof input.projectId === "string" && input.projectId.trim() ? input.projectId.trim() : null;
  const sourceUri = typeof input.sourceUri === "string" && input.sourceUri.trim() ? input.sourceUri.trim() : null;
  const tags = Array.isArray(input.tags) ? input.tags.filter((tag): tag is string => typeof tag === "string").map(tag => tag.trim().slice(0, 40)).filter(Boolean).slice(0, 12) : [];
  if (!agent || !agent.tools.includes("knowledge_write")) return NextResponse.json({ error: "This specialist cannot propose knowledge writes." }, { status: 403, headers: noStore });
  if (!title || title.length > 300 || !content || content.length > 20000) return NextResponse.json({ error: "A title (max 300) and content (max 20,000 characters) are required." }, { status: 400, headers: noStore });
  if (sourceUri) {
    try {
      const url = new URL(sourceUri);
      if (url.protocol !== "https:" || url.username || url.password || url.hostname === "localhost" || url.hostname.endsWith(".local")) throw new Error();
    } catch { return NextResponse.json({ error: "Source links must be valid public HTTPS URLs." }, { status: 400, headers: noStore }); }
  }

  const payload = { title, body: content, contentType, sensitivity, projectId, sourceUri, tags };
  const target = "owner-knowledge";
  const decision = evaluateToolRequest({ ownerId: owner.ownerId, agentKey, toolKey: "knowledge_write", target, args: payload });
  if (decision.outcome !== "approval_required") return NextResponse.json({ error: "Knowledge write is not permitted.", decision }, { status: 403, headers: noStore });
  const digest = createActionDigest({ ownerId: owner.ownerId, agentKey, toolKey: "knowledge_write", target, args: payload });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (projectId) {
      const project = await client.query("SELECT id FROM personal_projects WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL", [projectId, owner.ownerId]);
      if (!project.rowCount) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "The selected project was not found in your workspace." }, { status: 404, headers: noStore });
      }
    }
    const usage = await client.query("SELECT count(*)::int AS count FROM action_approvals WHERE owner_id=$1 AND requested_at>now()-interval '1 hour'", [owner.ownerId]);
    if (usage.rows[0].count >= 30) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Approval request limit reached. Try again later." }, { status: 429, headers: noStore });
    }
    const run = await client.query(
      "INSERT INTO agent_runs(owner_id,agent_key,task,status,autonomy_tier,input) VALUES($1,$2,$3,'waiting_approval',2,$4::jsonb) RETURNING id",
      [owner.ownerId, agentKey, "Propose knowledge record: " + title, JSON.stringify({ toolKey: "knowledge_write", digest })]
    );
    const approval = await client.query(
      "INSERT INTO action_approvals(owner_id,agent_run_id,action_type,action_summary,exact_payload,risk_tier,status,expires_at) VALUES($1,$2,'knowledge.create',$3,$4::jsonb,2,'pending',now()+interval '15 minutes') RETURNING id,expires_at",
      [owner.ownerId, run.rows[0].id, "Save knowledge: " + title, JSON.stringify({ payload, digest, agentKey, target })]
    );
    await client.query(
      "INSERT INTO activity_events(owner_id,actor_type,actor_id,event_type,resource_type,resource_id,summary,details) VALUES($1,'agent',$2,'knowledge.approval_requested','action_approval',$3,$4,$5::jsonb)",
      [owner.ownerId, agentKey, approval.rows[0].id, "Knowledge save awaiting owner approval", JSON.stringify({ title, contentType, digest })]
    );
    await client.query("COMMIT");
    return NextResponse.json({ runId: run.rows[0].id, approvalId: approval.rows[0].id, expiresAt: approval.rows[0].expires_at, digest, status: "pending" }, { status: 201, headers: noStore });
  } catch {
    await client.query("ROLLBACK").catch(() => undefined);
    return NextResponse.json({ error: "Could not create the knowledge approval request." }, { status: 503, headers: noStore });
  } finally { client.release(); }
}
