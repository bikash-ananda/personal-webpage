import { NextResponse } from "next/server";
import { pool } from "@/lib/auth";
import { getOwnerContext } from "@/lib/server/owner";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET() {
  const owner = await getOwnerContext();
  if (!owner.ok) return NextResponse.json({ error: owner.error }, { status: owner.status, headers: noStore });
  try {
    const result = await pool.query(
      `SELECT id AS "approvalId", action_summary AS title, expires_at AS "expiresAt", requested_at AS "requestedAt"
       FROM action_approvals
       WHERE owner_id=$1 AND action_type='knowledge.create' AND status='pending' AND expires_at>now()
       ORDER BY requested_at DESC LIMIT 20`,
      [owner.ownerId]
    );
    return NextResponse.json({ approvals: result.rows }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Approval inbox is unavailable." }, { status: 503, headers: noStore });
  }
}
