import { NextResponse } from "next/server";
import { pool } from "@/lib/auth";
import { getOwnerContext, hasTrustedMutationOrigin } from "@/lib/server/owner";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET() {
  const owner = await getOwnerContext();
  if (!owner.ok) return NextResponse.json({ error: owner.error }, { status: owner.status, headers: noStore });

  try {
    const result = await pool.query(
      `SELECT id, name, summary, status, priority, color, created_at, updated_at
       FROM personal_projects
       WHERE owner_id = $1 AND archived_at IS NULL
       ORDER BY updated_at DESC
       LIMIT 100`,
      [owner.ownerId]
    );
    return NextResponse.json({ projects: result.rows }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Project storage is unavailable. Apply the database migrations first." }, { status: 503, headers: noStore });
  }
}

export async function POST(request: Request) {
  if (!hasTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403, headers: noStore });
  }

  const owner = await getOwnerContext();
  if (!owner.ok) return NextResponse.json({ error: owner.error }, { status: owner.status, headers: noStore });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400, headers: noStore });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid project details." }, { status: 400, headers: noStore });
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const summary = typeof input.summary === "string" ? input.summary.trim() : "";
  const priority = ["low", "medium", "high", "critical"].includes(String(input.priority)) ? String(input.priority) : "medium";

  if (!name || name.length > 180 || summary.length > 5000) {
    return NextResponse.json({ error: "Project name is required (max 180 characters); summary must be under 5000 characters." }, { status: 400, headers: noStore });
  }

  try {
    const result = await pool.query(
      `WITH created AS (
         INSERT INTO personal_projects (owner_id, name, summary, priority)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, summary, status, priority, created_at, updated_at
       ),
       logged AS (
         INSERT INTO activity_events (owner_id, actor_type, event_type, resource_type, resource_id, summary, details)
         SELECT $1, 'owner', 'project.created', 'project', id::text,
                'Created project: ' || name, jsonb_build_object('priority', priority)
         FROM created
       )
       SELECT * FROM created`,
      [owner.ownerId, name, summary, priority]
    );
    return NextResponse.json({ project: result.rows[0] }, { status: 201, headers: noStore });
  } catch {
    return NextResponse.json({ error: "Project could not be saved. Confirm the database migration is applied." }, { status: 503, headers: noStore });
  }
}


export async function PATCH(request: Request) {
  if (!hasTrustedMutationOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403, headers: noStore });
  const owner = await getOwnerContext();
  if (!owner.ok) return NextResponse.json({ error: owner.error }, { status: owner.status, headers: noStore });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400, headers: noStore }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid project update." }, { status: 400, headers: noStore });
  const input = body as Record<string, unknown>;
  const id = typeof input.id === "string" ? input.id : "";
  const status = typeof input.status === "string" ? input.status : "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["planned","active","paused","completed","archived"].includes(status)) {
    return NextResponse.json({ error: "A valid project ID and status are required." }, { status: 400, headers: noStore });
  }
  try {
    const result = await pool.query(
      `WITH updated AS (
         UPDATE personal_projects
         SET status=$3, archived_at=CASE WHEN $3='archived' THEN now() ELSE NULL END, updated_at=now()
         WHERE id=$1 AND owner_id=$2
         RETURNING id,name,status,priority,updated_at
       ),
       logged AS (
         INSERT INTO activity_events (owner_id, actor_type, event_type, resource_type, resource_id, summary, details)
         SELECT $2, 'owner', 'project.status_changed', 'project', id::text,
                'Changed project status: ' || name,
                jsonb_build_object('status', status)
         FROM updated
       )
       SELECT * FROM updated`,
      [id,owner.ownerId,status]
    );
    if (!result.rowCount) return NextResponse.json({ error: "Project not found." }, { status: 404, headers: noStore });
    return NextResponse.json({ project: result.rows[0] }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Project status could not be updated." }, { status: 503, headers: noStore });
  }
}
