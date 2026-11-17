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
      `INSERT INTO personal_tasks (owner_id, project_id, title, description, priority, due_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, project_id, title, description, status, priority, due_at, created_at, updated_at`,
      [owner.ownerId, projectId, title, description, priority, dueAt]
    );
    return NextResponse.json({ task: result.rows[0] }, { status: 201, headers: noStore });
  } catch {
    return NextResponse.json({ error: "Task could not be saved. Check the project and database migration." }, { status: 503, headers: noStore });
  }
}
