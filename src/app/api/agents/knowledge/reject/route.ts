import { NextResponse } from "next/server";
import { pool } from "@/lib/auth";
import { getOwnerContext, hasTrustedMutationOrigin } from "@/lib/server/owner";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

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
    const result = await client.query(
      "SELECT id,agent_run_id FROM action_approvals WHERE id=$1 AND owner_id=$2 AND action_type='knowledge.create' AND status='pending' FOR UPDATE",
      [approvalId, owner.ownerId]
    );
    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Pending approval not found." }, { status: 404, headers: noStore });
    }
    const row = result.rows[0] as { id: string; agent_run_id: string | null };
    await client.query("UPDATE action_approvals SET status='rejected',decided_at=now(),decision_note='Rejected by owner' WHERE id=$1 AND owner_id=$2 AND status='pending'", [approvalId, owner.ownerId]);
    if (row.agent_run_id) await client.query("UPDATE agent_runs SET status='cancelled',error_code='owner_rejected',finished_at=now() WHERE id=$1 AND owner_id=$2", [row.agent_run_id, owner.ownerId]);
    await client.query(
      "INSERT INTO activity_events(owner_id,actor_type,event_type,resource_type,resource_id,summary,details) VALUES($1,'owner','knowledge.approval_rejected','action_approval',$2,'Rejected knowledge save request',$3::jsonb)",
      [owner.ownerId, approvalId, JSON.stringify({ agent_run_id: row.agent_run_id })]
    );
    await client.query("COMMIT");
    return NextResponse.json({ rejected: true }, { headers: noStore });
  } catch {
    await client.query("ROLLBACK").catch(() => undefined);
    return NextResponse.json({ error: "Approval could not be rejected." }, { status: 503, headers: noStore });
  } finally { client.release(); }
}
