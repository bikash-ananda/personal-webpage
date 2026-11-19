import { NextResponse } from "next/server";
import { pool } from "@/lib/auth";
import { createActionDigest, evaluateToolRequest } from "@/lib/agents/runtime";
import { getOwnerContext, hasTrustedMutationOrigin } from "@/lib/server/owner";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

type KnowledgePayload = {
  title: string; body: string; contentType: "note" | "document" | "url" | "conversation" | "research" | "file";
  sensitivity: "normal" | "private" | "sensitive" | "restricted";
  projectId: string | null; sourceUri: string | null; tags: string[];
};

export async function POST(request: Request) {
  if (!hasTrustedMutationOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403, headers: noStore });
  const owner = await getOwnerContext();
  if (!owner.ok) return NextResponse.json({ error: owner.error }, { status: owner.status, headers: noStore });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "A valid JSON body is required." }, { status: 400, headers: noStore }); }
  const approvalId = body && typeof body === "object" && "approvalId" in body && typeof body.approvalId === "string" ? body.approvalId : "";
  if (!/^[0-9a-f-]{36}$/i.test(approvalId)) return NextResponse.json({ error: "A valid approval ID is required." }, { status: 400, headers: noStore });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const found = await client.query(
      "SELECT id,agent_run_id,action_type,exact_payload,risk_tier,status,expires_at FROM action_approvals WHERE id=$1 AND owner_id=$2 FOR UPDATE",
      [approvalId, owner.ownerId]
    );
    if (!found.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Approval request not found." }, { status: 404, headers: noStore });
    }
    const approval = found.rows[0] as {
      id: string; agent_run_id: string; action_type: string;
      exact_payload: { payload?: KnowledgePayload; digest?: string; agentKey?: string; target?: string };
      risk_tier: number; status: string; expires_at: Date | string | null;
    };
    if (approval.status !== "pending" || approval.action_type !== "knowledge.create" || approval.risk_tier !== 2) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "This approval is no longer pending or has an unsupported action type." }, { status: 409, headers: noStore });
    }
    if (!approval.expires_at || new Date(approval.expires_at).getTime() <= Date.now()) {
      await client.query("UPDATE action_approvals SET status='expired',decided_at=now(),decision_note='Approval expired' WHERE id=$1 AND owner_id=$2", [approvalId, owner.ownerId]);
      await client.query("UPDATE agent_runs SET status='failed',error_code='approval_expired',finished_at=now() WHERE id=$1 AND owner_id=$2", [approval.agent_run_id, owner.ownerId]);
      await client.query("COMMIT");
      return NextResponse.json({ error: "This approval expired. Submit the knowledge record again." }, { status: 410, headers: noStore });
    }

    const { payload, digest, agentKey, target } = approval.exact_payload;
    if (!payload || !digest || !agentKey || target !== "owner-knowledge") throw new Error("Stored approval payload is incomplete.");
    const currentDigest = createActionDigest({ ownerId: owner.ownerId, agentKey, toolKey: "knowledge_write", target, args: payload });
    if (currentDigest !== digest) throw new Error("Approval payload integrity check failed.");
    const decision = evaluateToolRequest({ ownerId: owner.ownerId, agentKey, toolKey: "knowledge_write", target, args: payload });
    if (decision.outcome !== "approval_required" || decision.actionDigest !== digest) throw new Error("Current agent policy no longer permits this action.");

    const inserted = await client.query(
      `INSERT INTO personal_knowledge(owner_id,project_id,title,body,content_type,source_uri,sensitivity,provenance,tags)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)
       RETURNING id,title,content_type,sensitivity,source_uri,project_id,created_at`,
      [owner.ownerId, payload.projectId, payload.title, payload.body, payload.contentType, payload.sourceUri, payload.sensitivity,
        JSON.stringify({ agent_key: agentKey, approval_id: approvalId, action_digest: digest }), payload.tags]
    );
    await client.query(
      "UPDATE action_approvals SET status='executed',decided_at=now(),decision_note='Owner approved exact payload',executed_at=now() WHERE id=$1 AND owner_id=$2 AND status='pending'",
      [approvalId, owner.ownerId]
    );
    await client.query(
      "UPDATE agent_runs SET status='succeeded',output=$2::jsonb,finished_at=now() WHERE id=$1 AND owner_id=$3",
      [approval.agent_run_id, JSON.stringify({ saved: true, knowledgeId: inserted.rows[0].id, approvalId }), owner.ownerId]
    );
    await client.query(
      "INSERT INTO activity_events(owner_id,actor_type,event_type,resource_type,resource_id,summary,details) VALUES($1,'owner','knowledge.created','knowledge',$2,$3,$4::jsonb)",
      [owner.ownerId, inserted.rows[0].id, "Approved and saved knowledge: " + payload.title, JSON.stringify({ approval_id: approvalId, agent_key: agentKey, content_type: payload.contentType })]
    );
    await client.query("COMMIT");
    return NextResponse.json({ saved: true, knowledge: inserted.rows[0] }, { status: 201, headers: noStore });
  } catch {
    await client.query("ROLLBACK").catch(() => undefined);
    return NextResponse.json({ error: "Approval could not be executed. No knowledge record was saved." }, { status: 409, headers: noStore });
  } finally { client.release(); }
}
