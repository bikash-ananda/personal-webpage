import { NextResponse } from "next/server";
import { pool } from "@/lib/auth";
import { getOwnerContext, hasTrustedMutationOrigin } from "@/lib/server/owner";
import { getAgent } from "@/lib/agents/registry";

export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store, max-age=0"};

type ProposedTask={title:string;description:string;priority:"low"|"medium"|"high"|"critical";due_in_days:number|null};
function parsePlan(content:string):ProposedTask[] {
  const parsed=JSON.parse(content) as {tasks?:unknown};
  if(!Array.isArray(parsed.tasks) || parsed.tasks.length < 1 || parsed.tasks.length > 12) throw new Error("The model did not return a valid task list (1 to 12 tasks required).");
  return parsed.tasks.map((raw)=>{
    if(!raw||typeof raw!=="object") throw new Error("Invalid task in generated plan.");
    const item=raw as Record<string,unknown>;
    const title=typeof item.title==="string"?item.title.trim():"";
    const description=typeof item.description==="string"?item.description.trim():"";
    const priority=["low","medium","high","critical"].includes(String(item.priority))?item.priority as ProposedTask["priority"]:"medium";
    const due=typeof item.due_in_days==="number"&&Number.isInteger(item.due_in_days)?Math.max(0,Math.min(365,item.due_in_days)):null;
    if(!title||title.length>300||description.length>3000) throw new Error("A generated task exceeded validation limits.");
    return {title,description,priority,due_in_days:due};
  });
}

export async function POST(request:Request) {
 if(!hasTrustedMutationOrigin(request)) return NextResponse.json({error:"Request origin is not allowed."},{status:403,headers:noStore});
 const owner=await getOwnerContext();
 if(!owner.ok) return NextResponse.json({error:owner.error},{status:owner.status,headers:noStore});
 let body:unknown;
 try{body=await request.json();}catch{return NextResponse.json({error:"A valid JSON request body is required."},{status:400,headers:noStore});}
 if(!body||typeof body!=="object") return NextResponse.json({error:"Describe the work you want planned."},{status:400,headers:noStore});
 const input=body as Record<string,unknown>;
 const brief=typeof input.brief==="string"?input.brief.trim():"";
 const agentKey=typeof input.agentKey==="string"?input.agentKey:"chief_of_staff";
 const agent=getAgent(agentKey);
 if(!agent) return NextResponse.json({error:"Unknown specialist agent."},{status:400,headers:noStore});
 if(!brief||brief.length>5000) return NextResponse.json({error:"A work brief is required (maximum 5000 characters)."},{status:400,headers:noStore});
 const base=(process.env.AI_BASE_URL||"").replace(/\/+$/,"");
 const model=process.env.AI_MODEL||"";
 const apiKey=process.env.AI_API_KEY||"";
 if(!base||!model) return NextResponse.json({error:"AI provider is not configured. Set AI_BASE_URL and AI_MODEL in the private server environment; add AI_API_KEY for hosted providers."},{status:503,headers:noStore});
 let runId:string|null=null;
 try{
  const client=await pool.connect();
  try{
   await client.query("BEGIN");
   await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[owner.ownerId]);
   const usage=await client.query(
    "SELECT count(*)::int AS count FROM agent_runs WHERE owner_id=$1 AND created_at>now()-interval '1 hour'",
    [owner.ownerId]
   );
   if(usage.rows[0].count>=10){
    await client.query("ROLLBACK");
    return NextResponse.json({error:"Planning limit reached. Try again later."},{status:429,headers:noStore});
   }
   const run=await client.query("INSERT INTO agent_runs(owner_id,agent_key,task,status,autonomy_tier,input) VALUES($1,$2,$3,'running',0,$4::jsonb) RETURNING id",[owner.ownerId,agent.key,brief,JSON.stringify({brief,agent:agent.name})]);
   runId=run.rows[0].id as string;
   await client.query("COMMIT");
  }catch(error){
   await client.query("ROLLBACK").catch(()=>undefined);
   throw error;
  }finally{
   client.release();
  }
  const system="You are "+agent.name+" for a private Personal AI OS. Mission: "+agent.mission+". Return only JSON with shape {\"tasks\":[{\"title\":\"...\",\"description\":\"...\",\"priority\":\"low|medium|high|critical\",\"due_in_days\":number|null}]}. Create 3 to 8 practical, ordered tasks. Do not claim to execute tools, contact people, modify files or deploy anything. This is a proposal only. Respect the owner's safety and ask for approval for consequential actions.";
  const headers:Record<string,string>={"Content-Type":"application/json"};
  if(apiKey) headers.Authorization="Bearer "+apiKey;
  const response=await fetch(base+"/chat/completions",{method:"POST",headers,signal:AbortSignal.timeout(45000),body:JSON.stringify({model,messages:[{role:"system",content:system},{role:"user",content:"Create a practical work plan from this brief:\n\n"+brief}],temperature:0.2,response_format:{type:"json_object"}})});
  if(!response.ok) throw new Error("AI provider returned HTTP "+response.status+".");
  const payload=await response.json() as {choices?:{message?:{content?:string}}[]};
  const text=payload.choices?.[0]?.message?.content;
  if(!text) throw new Error("AI provider returned an empty plan.");
  const tasks=parsePlan(text);
  await pool.query("UPDATE agent_runs SET status='succeeded',output=$2::jsonb,finished_at=now() WHERE id=$1 AND owner_id=$3",[runId,JSON.stringify({tasks}),owner.ownerId]);
  return NextResponse.json({runId,agent:agent.name,tasks},{headers:noStore});
 }catch(error){
  if(runId) await pool.query("UPDATE agent_runs SET status='failed',error_code='planning_failed',finished_at=now() WHERE id=$1 AND owner_id=$2",[runId,owner.ownerId]).catch(()=>undefined);
  const message=error instanceof Error?error.message:"Agent planning failed.";
  return NextResponse.json({error:message},{status:503,headers:noStore});
 }
}
