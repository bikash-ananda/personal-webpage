import { NextResponse } from "next/server";
import { pool } from "@/lib/auth";
import { getOwnerContext } from "@/lib/server/owner";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET() {
  const owner = await getOwnerContext();
  if (!owner.ok) {
    return NextResponse.json({ error: owner.error }, { status: owner.status, headers: noStore });
  }

  try {
    const result = await pool.query(
      `SELECT id, actor_type, event_type, resource_type, resource_id, summary, details, created_at
       FROM activity_events
       WHERE owner_id = $1
       ORDER BY id DESC
       LIMIT 100`,
      [owner.ownerId]
    );
    return NextResponse.json({ events: result.rows }, { headers: noStore });
  } catch {
    return NextResponse.json(
      { error: "Activity storage is unavailable. Apply the Personal OS database migrations first." },
      { status: 503, headers: noStore }
    );
  }
}
