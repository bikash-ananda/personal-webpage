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
      `INSERT INTO personal_projects (owner_id, name, summary, priority)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, summary, status, priority, created_at, updated_at`,
      [owner.ownerId, name, summary, priority]
    );
    return NextResponse.json({ project: result.rows[0] }, { status: 201, headers: noStore });
  } catch {
    return NextResponse.json({ error: "Project could not be saved. Confirm the database migration is applied." }, { status: 503, headers: noStore });
  }
}
