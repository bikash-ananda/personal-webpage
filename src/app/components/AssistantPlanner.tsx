"use client";
import { FormEvent,useState } from "react";
import { Bot, CheckCircle2, CircleAlert, ListTodo, Sparkles } from "lucide-react";
type PlanTask={title:string;description:string;priority:"low"|"medium"|"high"|"critical";due_in_days:number|null};
const agents=[["chief_of_staff","Chief of Staff"],["engineering","Project & Engineering"],["research","Research & Learning"],["communications","Communications"],["business_ops","Business Operations"],["infrastructure","Computer & Infrastructure"],["knowledge","Knowledge & Memory"],["voice","Voice Companion"],["agriculture_iot","Agriculture & IoT"],["finance_admin","Finance & Administration"]];
export default function AssistantPlanner({ readOnlyPreview = false }: { readOnlyPreview?: boolean }){
 const [brief,setBrief]=useState(""); const [agentKey,setAgentKey]=useState("chief_of_staff");
 const [tasks,setTasks]=useState<PlanTask[]>([]); const [loading,setLoading]=useState(false); const [saving,setSaving]=useState(false); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
 async function plan(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setLoading(true);setError("");setNotice("");setTasks([]);
  try{
   const r=await fetch("/api/agents/plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({brief,agentKey})});
   const data=await r.json();if(!r.ok)throw new Error(data.error||"Planning failed.");
   setTasks(data.tasks||[]);setNotice("Plan created by "+data.agent+". Review it before saving tasks.");
  }catch(e){setError(e instanceof Error?e.message:"Planning failed.");}
  finally{setLoading(false);}
 }
 async function saveTasks(){
  setSaving(true);setError("");let saved=0;
  try{
   for(const task of tasks){
    let dueAt:string|null=null;
    if(task.due_in_days!==null){const d=new Date();d.setDate(d.getDate()+task.due_in_days);dueAt=d.toISOString();}
    const r=await fetch("/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:task.title,description:task.description,priority:task.priority,dueAt})});
    const data=await r.json();if(!r.ok)throw new Error(data.error||"Could not save task "+task.title);
    saved++;
   }
   setNotice(saved+" approved tasks saved to your task queue.");setTasks([]);
  }catch(e){setError((e instanceof Error?e.message:"Saving failed.")+" Saved "+saved+" of "+tasks.length+" tasks; review the task queue before retrying.");}
  finally{setSaving(false);}
 }
 return <div style={{maxWidth:850,marginTop:26}}>{readOnlyPreview ? <section className="panel preview-module"><div className="panel-title">AI planning preview</div><p className="panel-sub">Explore the specialist planning interface. Model requests and task approvals are disabled in public preview mode and require owner sign-in.</p><div className="preview-module-grid">{agents.slice(0,6).map(([key,name])=><span key={key}>{name}</span>)}</div></section> : <>
  <section className="panel"><div className="panel-head"><div><div className="panel-title">Plan work with your AI team</div><div className="panel-sub">A model-powered specialist proposes tasks; you approve before anything is saved.</div></div><span className="agent-icon"><Bot size={17}/></span></div>
   <form onSubmit={plan} style={{display:"grid",gap:12}}>
    <label style={{display:"grid",gap:6,fontSize:11,color:"var(--muted)"}}>Choose a specialist<select value={agentKey} onChange={e=>setAgentKey(e.target.value)} style={{width:"100%",minHeight:42,padding:"10px 12px",border:"1px solid var(--line)",borderRadius:9,background:"#0b1322",color:"var(--text)"}}>{agents.map(a=><option value={a[0]} key={a[0]}>{a[1]}</option>)}</select></label>
    <label style={{display:"grid",gap:6,fontSize:11,color:"var(--muted)"}}>What do you want to accomplish?<textarea required maxLength={5000} rows={6} value={brief} onChange={e=>setBrief(e.target.value)} placeholder="Example: Plan the next two weeks of work on the ESP32 greenhouse controller. Include firmware, sensor calibration, BLE Wi-Fi setup, server integration and field testing." style={{width:"100%",padding:13,border:"1px solid var(--line)",borderRadius:9,background:"#0b1322",color:"var(--text)",font:"12px 'DM Sans',sans-serif",resize:"vertical"}}/></label>
    <div style={{display:"flex",justifyContent:"flex-end"}}><button type="submit" disabled={loading||!brief.trim()} style={{display:"inline-flex",alignItems:"center",gap:8,minHeight:41,padding:"0 15px",border:0,borderRadius:9,background:"var(--mint)",color:"#092018",fontWeight:700,fontSize:11}}><Sparkles size={14}/>{loading?"Preparing plan…":"Generate work plan"}</button></div>
   </form>
  </section>
  {error&&<div role="alert" style={{display:"flex",gap:9,padding:13,marginTop:13,border:"1px solid rgba(244,154,154,.25)",borderRadius:10,color:"#f49a9a",fontSize:11}}><CircleAlert size={15}/>{error}</div>}
  {notice&&<div role="status" style={{display:"flex",gap:9,padding:13,marginTop:13,border:"1px solid rgba(155,240,199,.2)",borderRadius:10,color:"var(--mint)",fontSize:11}}><CheckCircle2 size={15}/>{notice}</div>}
  {tasks.length>0&&<section className="panel" style={{marginTop:15}}><div className="panel-head"><div><div className="panel-title">Proposed execution plan</div><div className="panel-sub">{tasks.length} proposed tasks · not saved yet</div></div><span className="text-link">REVIEW REQUIRED</span></div>
   {tasks.map((t,i)=><div className="task-row" key={i}><span className="task-check">{i+1}</span><div style={{minWidth:0}}><div className="task-name" style={{fontWeight:700}}>{t.title}</div><div className="task-meta" style={{fontFamily:"inherit",fontSize:10,lineHeight:1.5}}>{t.description}</div><div className="task-meta">{t.priority.toUpperCase()} · {t.due_in_days===null?"NO DUE DATE":"DUE IN "+t.due_in_days+" DAYS"}</div></div></div>)}
   <div style={{display:"flex",justifyContent:"flex-end",marginTop:14}}><button type="button" onClick={()=>void saveTasks()} disabled={saving} style={{display:"inline-flex",alignItems:"center",gap:8,minHeight:41,padding:"0 15px",border:0,borderRadius:9,background:"var(--mint)",color:"#092018",fontWeight:700,fontSize:11}}><ListTodo size={14}/>{saving?"Saving approved tasks…":"Approve & add tasks"}</button></div>
  </section>}
  <p className="muted" style={{fontSize:10,lineHeight:1.7,marginTop:14}}>Safety boundary: the agent can create a plan and execution record. It cannot deploy code, send messages, alter servers or control hardware. Those actions require separate tool integrations and explicit approval policies.</p>
 </> }</div>;
}
