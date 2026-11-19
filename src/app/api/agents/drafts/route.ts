import { NextResponse } from "next/server";
import { pool } from "@/lib/auth";
import { evaluateToolRequest } from "@/lib/agents/runtime";
import { getAgent } from "@/lib/agents/registry";
import { getOwnerContext, hasTrustedMutationOrigin } from "@/lib/server/owner";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function POST(request: Request) {
  if (!hasTrustedMutationOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403, headers: noStore });
  const owner = await getOwnerContext();
  if (!owner.ok) return NextResponse.json({ error: owner.error }, { status: owner.status, headers: noStore });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "A valid JSON body is required." }, { status: 400, headers: noStore }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid communication draft." }, { status: 400, headers: noStore });
  const input = body as Record<string, unknown>;
  const agentKey = typeof input.agentKey === "string" ? input.agentKey : "communications";
  const agent = getAgent(agentKey);
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const content = typeof input.body === "string" ? input.body.trim() : "";
  if (!agent || !agent.tools.includes("draft_create")) return NextResponse.json({ error: "This specialist cannot create communication drafts." }, { status: 403, headers: noStore });
  if (!title || title.length > 300 || !content || content.length > 12000) return NextResponse.json({ error: "A title (max 300) and draft content (max 12,000 characters) are required." }, { status: 400, headers: noStore });
  const args = { title, body: content, status: "unsent" };
  const decision = evaluateToolRequest({ ownerId: owner.ownerId, agentKey, toolKey: "draft_create", target: "owner-drafts", args });
  if (decision.outcome !== "allow") return NextResponse.json({ error: "Draft creation is not permitted.", decision }, { status: 403, headers: noStore });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const usage = await client.query("SELECT count(*)::int AS count FROM personal_knowledge WHERE owner_id=$1 AND provenance->>'kind'='unsent_communication_draft' AND created_at>now()-interval '1 hour'", [owner.ownerId]);
    if (usage.rows[0].count >= 30) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Draft creation limit reached. Try again later." }, { status: 429, headers: noStore });
    }
    const inserted = await client.query(
      `INSERT INTO personal_knowledge(owner_id,title,body,content_type,sensitivity,provenance,tags)
       VALUES($1,$2,$3,'conversation','private',$4::jsonb,ARRAY['communication','draft'])
       RETURNING id,title,body,created_at`,
      [owner.ownerId, title, content, JSON.stringify({ kind: "unsent_communication_draft", status: "unsent", agent_key: agentKey })]
    );
    await client.query(
      "INSERT INTO activity_events(owner_id,actor_type,actor_id,event_type,resource_type,resource_id,summary,details) VALUES($1,'agent',$2,'communication.draft_saved','knowledge',$3,$4,$5::jsonb)",
      [owner.ownerId, agentKey, inserted.rows[0].id, "Saved unsent communication draft: " + title, JSON.stringify({ status: "unsent" })]
    );
    await client.query("COMMIT");
    return NextResponse.json({ saved: true, sent: false, draft: inserted.rows[0] }, { status: 201, headers: noStore });
  } catch {
    await client.query("ROLLBACK").catch(() => undefined);
    return NextResponse.json({ error: "Communication draft could not be saved." }, { status: 503, headers: noStore });
  } finally { client.release(); }
}
