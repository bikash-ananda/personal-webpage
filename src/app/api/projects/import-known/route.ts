import { NextResponse } from "next/server";
import { pool } from "@/lib/auth";
import { getOwnerContext, hasTrustedMutationOrigin } from "@/lib/server/owner";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

// Explicit, idempotent import of projects already established in the owner's work history.
const knownProjects = [
  { name:"Personal AI OS", summary:"Private personal operating system: owner dashboard, project and task management, specialist AI agents, knowledge, integrations and safe automation.", priority:"high", metadata:{ domain:"personal productivity", source:"known owner project" } },
  { name:"BNB Machinery", summary:"Machinery and tools commerce platform, including product catalogue, operations and business workflows.", priority:"high", metadata:{ domain:"software and business", repository:"bikash-ananda/bnb-machinery", source:"known owner project" } },
  { name:"Nepal Wildlife Management System", summary:"Wildlife and human-wildlife conflict management platform with public education, incident workflows and institutional operations.", priority:"high", metadata:{ domain:"software and civic technology", repository:"bikash-ananda/Nepal-Wild--Life--Management--System", source:"known owner project" } },
  { name:"Digital Agriculture & Smart Greenhouse", summary:"Agricultural monitoring and greenhouse IoT system using ESP32 devices, sensors, connectivity and server-side automation.", priority:"high", metadata:{ domain:"electronics, embedded systems and IoT", repository:"bikash-ananda/Digital-Agriculture", source:"known owner project" } },
  { name:"BEOS – Business Enterprise Operating System", summary:"Business and enterprise operations platform for Mitra Solution.", priority:"medium", metadata:{ domain:"software and business operations", repository:"bikash-ananda/BEOS", source:"known owner project" } }
];

export async function POST(request: Request) {
  if (!hasTrustedMutationOrigin(request)) return NextResponse.json({error:"Request origin is not allowed."},{status:403,headers:noStore});
  const owner=await getOwnerContext();
  if(!owner.ok) return NextResponse.json({error:owner.error},{status:owner.status,headers:noStore});
  try {
    const result=await pool.query(
      `WITH imported AS (
         INSERT INTO personal_projects(owner_id,name,summary,status,priority,metadata)
         SELECT $1,v.name,v.summary,'active',v.priority,v.metadata
         FROM jsonb_to_recordset($2::jsonb) AS v(name text,summary text,priority text,metadata jsonb)
         WHERE NOT EXISTS(SELECT 1 FROM personal_projects p WHERE p.owner_id=$1 AND lower(p.name)=lower(v.name))
         RETURNING id,name,summary,status,priority
       ),
       logged AS (
         INSERT INTO activity_events(owner_id,actor_type,event_type,resource_type,resource_id,summary,details)
         SELECT $1,'owner','project.imported','project',id::text,
                'Imported project: ' || name,
                jsonb_build_object('source','known owner project','priority',priority)
         FROM imported
       )
       SELECT * FROM imported`,
      [owner.ownerId,JSON.stringify(knownProjects)]
    );
    const total=await pool.query("SELECT count(*)::int AS count FROM personal_projects WHERE owner_id=$1 AND archived_at IS NULL",[owner.ownerId]);
    return NextResponse.json({imported:result.rows.length,projects:result.rows,total:total.rows[0].count},{headers:noStore});
  } catch {
    return NextResponse.json({error:"Known projects could not be imported. Confirm the Personal OS database migration is applied."},{status:503,headers:noStore});
  }
}
