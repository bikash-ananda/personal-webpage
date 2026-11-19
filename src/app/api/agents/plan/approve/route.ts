import { NextResponse } from "next/server";
import { pool } from "@/lib/auth";
import { getOwnerContext, hasTrustedMutationOrigin } from "@/lib/server/owner";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

type ProposedTask = {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  due_in_days: number | null;
};

export async function POST(request: Request) {
  if (!hasTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403, headers: noStore });
  }

  const owner = await getOwnerContext();
  if (!owner.ok) {
    return NextResponse.json({ error: owner.error }, { status: owner.status, headers: noStore });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400, headers: noStore });
  }

  const runId = body && typeof body === "object" && "runId" in body && typeof body.runId === "string"
    ? body.runId
    : "";
  if (!/^[0-9a-f-]{36}$/i.test(runId)) {
    return NextResponse.json({ error: "A valid planning run ID is required." }, { status: 400, headers: noStore });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Lock the server-stored proposal. The browser sends only its run ID, never task content.
    const runResult = await client.query(
      "SELECT id, status, output, created_at FROM agent_runs WHERE id = $1 AND owner_id = $2 FOR UPDATE",
      [runId, owner.ownerId]
    );
    if (!runResult.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Planning proposal not found." }, { status: 404, headers: noStore });
    }

    const run = runResult.rows[0] as { id: string; status: string; output: { tasks?: unknown; approved_at?: string } | null; created_at: Date | string };
    if (run.status !== "succeeded" || !run.output || !Array.isArray(run.output.tasks)) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "This planning proposal is not available for approval." }, { status: 409, headers: noStore });
    }
    const createdAt = new Date(run.created_at).getTime();
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > 30 * 60 * 1000) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "This proposal has expired. Generate a fresh plan before approving." }, { status: 410, headers: noStore });
    }
    if (run.output.approved_at) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "This proposal has already been approved." }, { status: 409, headers: noStore });
    }

    const proposed = run.output.tasks as ProposedTask[];
    if (proposed.length < 1 || proposed.length > 12) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "The stored proposal has an invalid task count." }, { status: 409, headers: noStore });
    }

    const inserted = [];
    for (const task of proposed) {
      if (
        !task || typeof task.title !== "string" || !task.title.trim() ||
        task.title.length > 300 || typeof task.description !== "string" ||
        task.description.length > 3000 ||
        !["low", "medium", "high", "critical"].includes(task.priority)
      ) {
        throw new Error("The stored proposal contains an invalid task.");
      }

      const dueAt = typeof task.due_in_days === "number" && Number.isInteger(task.due_in_days)
        ? new Date(Date.now() + Math.max(0, Math.min(365, task.due_in_days)) * 86_400_000).toISOString()
        : null;
      const result = await client.query(
        `INSERT INTO personal_tasks (owner_id, title, description, priority, due_at, source, metadata)
         VALUES ($1, $2, $3, $4, $5, 'agent_plan', jsonb_build_object('agent_run_id', $6::text))
         RETURNING id, title, description, priority, due_at, status, created_at`,
        [owner.ownerId, task.title.trim(), task.description.trim(), task.priority, dueAt, runId]
      );
      const saved = result.rows[0];
      await client.query(
        `INSERT INTO activity_events (owner_id, actor_type, event_type, resource_type, resource_id, summary, details)
         VALUES ($1, 'owner', 'task.created', 'task', $2, $3, $4::jsonb)`,
        [owner.ownerId, saved.id, "Approved AI plan task: " + saved.title, JSON.stringify({ priority: saved.priority, agent_run_id: runId })]
      );
      inserted.push(saved);
    }

    await client.query(
      "UPDATE agent_runs SET output = output || jsonb_build_object('approved_at', now()) WHERE id = $1 AND owner_id = $2",
      [runId, owner.ownerId]
    );
    await client.query(
      `INSERT INTO activity_events (owner_id, actor_type, event_type, resource_type, resource_id, summary, details)
       VALUES ($1, 'owner', 'agent.plan.approved', 'agent_run', $2, 'Approved AI work plan', $3::jsonb)`,
      [owner.ownerId, runId, JSON.stringify({ task_count: inserted.length })]
    );

    await client.query("COMMIT");
    return NextResponse.json({ saved: inserted.length, tasks: inserted }, { status: 201, headers: noStore });
  } catch {
    await client.query("ROLLBACK").catch(() => undefined);
    return NextResponse.json({ error: "The approved plan could not be saved. No tasks were committed." }, { status: 503, headers: noStore });
  } finally {
    client.release();
  }
}
