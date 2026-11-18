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
      `SELECT t.id, t.project_id, p.name AS project_name, t.title, t.description,
              t.status, t.priority, t.due_at, t.completed_at, t.created_at, t.updated_at
       FROM personal_tasks t
       LEFT JOIN personal_projects p ON p.id = t.project_id AND p.owner_id = t.owner_id
       WHERE t.owner_id = $1
       ORDER BY CASE t.status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 WHEN 'blocked' THEN 2 ELSE 3 END,
                t.due_at ASC NULLS LAST, t.created_at DESC
       LIMIT 200`,
      [owner.ownerId]
    );
    return NextResponse.json({ tasks: result.rows }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Task storage is unavailable. Apply the database migrations first." }, { status: 503, headers: noStore });
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
    return NextResponse.json({ error: "Invalid task details." }, { status: 400, headers: noStore });
  }

  const input = body as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const priority = ["low", "medium", "high", "critical"].includes(String(input.priority)) ? String(input.priority) : "medium";
  const projectId = typeof input.projectId === "string" && input.projectId.trim() ? input.projectId.trim() : null;
  const dueAt = typeof input.dueAt === "string" && !Number.isNaN(Date.parse(input.dueAt)) ? new Date(input.dueAt).toISOString() : null;

  if (!title || title.length > 300 || description.length > 10000) {
    return NextResponse.json({ error: "Task title is required (max 300 characters); description must be under 10000 characters." }, { status: 400, headers: noStore });
  }

  try {
    const result = await pool.query(
      `WITH created AS (
         INSERT INTO personal_tasks (owner_id, project_id, title, description, priority, due_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, project_id, title, description, status, priority, due_at, created_at, updated_at
       ),
       logged AS (
         INSERT INTO activity_events (owner_id, actor_type, event_type, resource_type, resource_id, summary, details)
         SELECT $1, 'owner', 'task.created', 'task', id::text,
                'Created task: ' || title,
                jsonb_build_object('priority', priority, 'project_id', project_id)
         FROM created
       )
       SELECT * FROM created`,
      [owner.ownerId, projectId, title, description, priority, dueAt]
    );
    return NextResponse.json({ task: result.rows[0] }, { status: 201, headers: noStore });
  } catch {
    return NextResponse.json({ error: "Task could not be saved. Check the project and database migration." }, { status: 503, headers: noStore });
  }
}


export async function PATCH(request: Request) {
  if (!hasTrustedMutationOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403, headers: noStore });
  const owner = await getOwnerContext();
  if (!owner.ok) return NextResponse.json({ error: owner.error }, { status: owner.status, headers: noStore });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400, headers: noStore }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid task update." }, { status: 400, headers: noStore });
  const input = body as Record<string, unknown>;
  const id = typeof input.id === "string" ? input.id : "";
  const status = typeof input.status === "string" ? input.status : "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["todo","in_progress","blocked","done","cancelled"].includes(status)) {
    return NextResponse.json({ error: "A valid task ID and status are required." }, { status: 400, headers: noStore });
  }
  try {
    const result = await pool.query(
      `WITH updated AS (
         UPDATE personal_tasks
         SET status=$3, completed_at=CASE WHEN $3='done' THEN COALESCE(completed_at,now()) ELSE NULL END, updated_at=now()
         WHERE id=$1 AND owner_id=$2
         RETURNING id,title,status,priority,completed_at,updated_at
       ),
       logged AS (
         INSERT INTO activity_events (owner_id, actor_type, event_type, resource_type, resource_id, summary, details)
         SELECT $2, 'owner', 'task.status_changed', 'task', id::text,
                'Changed task status: ' || title,
                jsonb_build_object('status', status)
         FROM updated
       )
       SELECT * FROM updated`,
      [id,owner.ownerId,status]
    );
    if (!result.rowCount) return NextResponse.json({ error: "Task not found." }, { status: 404, headers: noStore });
    return NextResponse.json({ task: result.rows[0] }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Task status could not be updated." }, { status: 503, headers: noStore });
  }
}
