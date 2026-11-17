"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, FolderKanban, ListTodo, CalendarDays, CircleAlert, CheckCircle2 } from "lucide-react";

type Project = { id: string; name: string; summary: string; status: string; priority: string };
type Task = { id: string; project_id: string | null; project_name: string | null; title: string; description: string; status: string; priority: string; due_at: string | null };
const field: React.CSSProperties = { width:"100%", minHeight:42, padding:"10px 12px", border:"1px solid var(--line)", borderRadius:9, background:"#0b1322", color:"var(--text)", font:"12px 'DM Sans',sans-serif" };
const primary: React.CSSProperties = { display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, minHeight:40, padding:"0 14px", border:0, borderRadius:9, background:"var(--mint)", color:"#092018", fontSize:11, fontWeight:700, cursor:"pointer" };
const secondary: React.CSSProperties = { ...primary, background:"var(--panel2)", color:"var(--text)", border:"1px solid var(--line)" };

export default function WorkspaceData({ section }: { section: "projects" | "tasks" }) {
 const isProjects = section === "projects";
 const [projects,setProjects] = useState<Project[]>([]), [tasks,setTasks] = useState<Task[]>([]);
 const [loading,setLoading] = useState(true), [saving,setSaving] = useState(false), [importing,setImporting] = useState(false), [error,setError] = useState(""), [notice,setNotice] = useState(""), [showForm,setShowForm] = useState(false);
 const [name,setName] = useState(""), [summary,setSummary] = useState(""), [title,setTitle] = useState(""), [description,setDescription] = useState("");
 const [priority,setPriority] = useState("medium"), [projectId,setProjectId] = useState(""), [dueAt,setDueAt] = useState("");
 const load = useCallback(async () => {
  setLoading(true); setError("");
  try {
   const results = await Promise.all([fetch("/api/projects",{cache:"no-store"}),fetch("/api/tasks",{cache:"no-store"})]);
   const data = await Promise.all(results.map(r=>r.json()));
   if (!results[0].ok) throw new Error(data[0].error || "Projects could not be loaded.");
   if (!results[1].ok) throw new Error(data[1].error || "Tasks could not be loaded.");
   setProjects(data[0].projects || []); setTasks(data[1].tasks || []);
  } catch(e) { setError(e instanceof Error ? e.message : "Could not connect to workspace storage."); }
  finally { setLoading(false); }
 },[]);
 useEffect(()=>{ void load(); },[load]);
 async function importKnownProjects() {
  setImporting(true); setError(""); setNotice("");
  try {
   const response=await fetch("/api/projects/import-known",{method:"POST"});
   const data=await response.json();
   if(!response.ok) throw new Error(data.error||"Project import failed.");
   await load();
   setNotice(data.imported+" known projects imported; "+data.total+" projects now in your portfolio.");
  } catch(e) { setError(e instanceof Error?e.message:"Project import failed."); }
  finally { setImporting(false); }
 }
 async function updateStatus(id:string,status:string) {
  setError("");
  try {
   const response=await fetch(isProjects?"/api/projects":"/api/tasks",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});
   const data=await response.json();
   if(!response.ok) throw new Error(data.error||"Status update failed.");
   await load();
  } catch(e) { setError(e instanceof Error?e.message:"Status update failed."); }
 }
 async function submit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault(); setSaving(true); setError("");
  try {
   const response = await fetch(isProjects?"/api/projects":"/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(isProjects?{name,summary,priority}:{title,description,priority,projectId:projectId||null,dueAt:dueAt||null})});
   const data = await response.json();
   if (!response.ok) throw new Error(data.error || "The item could not be saved.");
   setShowForm(false); setName(""); setSummary(""); setTitle(""); setDescription(""); setDueAt(""); setProjectId(""); setPriority("medium"); await load();
  } catch(e) { setError(e instanceof Error?e.message:"Save failed."); }
  finally { setSaving(false); }
 }
 const list = isProjects ? projects : tasks;
 return <div style={{maxWidth:1050}}>
  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginTop:26,marginBottom:20}}>
   <div><div className="eyebrow">LIVE OWNER DATA · POSTGRESQL</div><h2 style={{font:"700 20px Manrope",margin:"8px 0 5px"}}>{isProjects?"Your projects":"Your task queue"}</h2><p className="muted" style={{fontSize:11,margin:0}}>{isProjects?"Real project records stored in your private workspace.":"Tasks linked to projects, priorities and due dates."}</p></div>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{isProjects&&<button type="button" style={secondary} onClick={()=>void importKnownProjects()} disabled={importing}><FolderKanban size={13}/>{importing?"Importing…":"Import known projects"}</button>}<button type="button" style={secondary} onClick={()=>void load()} disabled={loading}><RefreshCw size={13}/> Refresh</button><button type="button" style={primary} onClick={()=>setShowForm(v=>!v)}><Plus size={14}/>{isProjects?"New project":"New task"}</button></div>
  </div>
  {notice && <div role="status" style={{display:"flex",gap:9,alignItems:"center",padding:13,marginBottom:15,border:"1px solid rgba(155,240,199,.22)",borderRadius:10,background:"rgba(155,240,199,.06)",color:"var(--mint)",fontSize:11}}><CheckCircle2 size={15}/>{notice}</div>}
  {error && <div role="alert" style={{display:"flex",gap:9,alignItems:"center",padding:13,marginBottom:15,border:"1px solid rgba(244,154,154,.25)",borderRadius:10,background:"rgba(244,154,154,.06)",color:"#f49a9a",fontSize:11}}><CircleAlert size={15}/>{error}</div>}
  {showForm && <form onSubmit={submit} className="panel" style={{display:"grid",gap:12,marginBottom:17}}>
   <div className="panel-title">{isProjects?"Create a project":"Capture a task"}</div>
   <label style={{display:"grid",gap:6,fontSize:11,color:"var(--muted)"}}>{isProjects?"Project name":"Task title"}<input style={field} required maxLength={isProjects?180:300} value={isProjects?name:title} onChange={e=>isProjects?setName(e.target.value):setTitle(e.target.value)} placeholder={isProjects?"e.g. Smart Greenhouse Controller":"What needs to be done?"}/></label>
   <label style={{display:"grid",gap:6,fontSize:11,color:"var(--muted)"}}>Description / outcome<textarea style={{...field,minHeight:82,resize:"vertical"}} value={isProjects?summary:description} onChange={e=>isProjects?setSummary(e.target.value):setDescription(e.target.value)} placeholder="Context, goal, expected result…"/></label>
   {!isProjects && <label style={{display:"grid",gap:6,fontSize:11,color:"var(--muted)"}}>Project<select style={field} value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">No project yet</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
   <div style={{display:"grid",gridTemplateColumns:isProjects?"1fr":"1fr 1fr",gap:10}}>
    <label style={{display:"grid",gap:6,fontSize:11,color:"var(--muted)"}}>Priority<select style={field} value={priority} onChange={e=>setPriority(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
    {!isProjects && <label style={{display:"grid",gap:6,fontSize:11,color:"var(--muted)"}}>Due date<input type="date" style={field} value={dueAt} onChange={e=>setDueAt(e.target.value)}/></label>}
   </div>
   <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button type="button" style={secondary} onClick={()=>setShowForm(false)}>Cancel</button><button type="submit" style={primary} disabled={saving}>{saving?"Saving…":isProjects?"Save project":"Save task"}</button></div>
  </form>}
  <div className="stats" style={{gridTemplateColumns:"repeat(3,minmax(0,1fr))",marginBottom:16}}>
   <div className="stat"><div className="stat-head">{isProjects?"Projects":"Total tasks"}</div><div className="stat-value">{list.length}</div><div className="stat-foot">Loaded from your account</div></div>
   <div className="stat"><div className="stat-head">In progress</div><div className="stat-value">{isProjects?projects.filter(p=>p.status==="active").length:tasks.filter(t=>t.status==="in_progress").length}</div><div className="stat-foot">Current active work</div></div>
   <div className="stat"><div className="stat-head">Completed</div><div className="stat-value">{isProjects?projects.filter(p=>p.status==="completed").length:tasks.filter(t=>t.status==="done").length}</div><div className="stat-foot">Recorded as complete</div></div>
  </div>
  <section className="panel">
   <div className="panel-head"><div><div className="panel-title">{isProjects?"Project portfolio":"Execution list"}</div><div className="panel-sub">{loading?"Loading live records…":list.length+" record"+(list.length===1?"":"s")+" · private to your account"}</div></div><span className="text-link">{isProjects?"PROJECTS":"TASKS"}</span></div>
   {loading?<p className="muted" style={{fontSize:12}}>Loading…</p>:list.length===0?<div style={{textAlign:"center",padding:"35px 12px"}}><span className="agent-icon" style={{margin:"0 auto 12px",width:42,height:42}}>{isProjects?<FolderKanban size={19}/>:<ListTodo size={19}/>}</span><div className="panel-title">No {isProjects?"projects":"tasks"} yet</div><p className="muted" style={{fontSize:11,lineHeight:1.7,maxWidth:400,margin:"8px auto 16px"}}>{isProjects?"Add your real engineering, software, hardware, electronics, robotics, agriculture and business projects here.":"Create a task directly or link it to one of your projects. Your progress will be reflected here."}</p><button type="button" style={primary} onClick={()=>setShowForm(true)}><Plus size={13}/> Add your first {isProjects?"project":"task"}</button></div>
   :isProjects?projects.map(p=><div key={p.id} className="task-row" style={{alignItems:"flex-start"}}><span className="agent-icon"><FolderKanban size={15}/></span><div style={{minWidth:0}}><div className="task-name" style={{fontWeight:700}}>{p.name}</div><div className="task-meta" style={{fontFamily:"inherit",fontSize:10,lineHeight:1.6}}>{p.summary||"No project summary added"}</div><div className="task-meta">{p.status.toUpperCase()} · {p.priority.toUpperCase()}</div></div><select aria-label={"Update status for "+p.name} style={{...field,width:"auto",minHeight:30,padding:"4px 7px",fontSize:10}} value={p.status} onChange={e=>void updateStatus(p.id,e.target.value)}><option value="planned">Planned</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option><option value="archived">Archived</option></select></div>)
   :tasks.map(t=><div key={t.id} className="task-row" style={{alignItems:"flex-start"}}><span className="task-check" style={{marginTop:2,borderColor:t.status==="done"?"var(--mint)":"#53637c",background:t.status==="done"?"rgba(155,240,199,.14)":"transparent"}}>{t.status==="done"&&<CheckCircle2 size={13}/>}</span><div style={{minWidth:0}}><div className="task-name" style={{fontWeight:700,textDecoration:t.status==="done"?"line-through":"none"}}>{t.title}</div><div className="task-meta" style={{fontFamily:"inherit",fontSize:10}}>{t.project_name||"Unassigned"}{t.description?" · "+t.description:""}</div><div className="task-meta">{t.status.replace("_"," ").toUpperCase()} · {t.priority.toUpperCase()}{t.due_at?" · DUE "+new Date(t.due_at).toLocaleDateString():""}</div></div><select aria-label={"Update status for "+t.title} style={{...field,width:"auto",minHeight:30,padding:"4px 7px",fontSize:10}} value={t.status} onChange={e=>void updateStatus(t.id,e.target.value)}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="done">Done</option><option value="cancelled">Cancelled</option></select></div>)}
  </section>
  <p className="muted" style={{display:"flex",alignItems:"center",gap:7,fontSize:10,marginTop:13}}><CalendarDays size={12}/> Changes save to your private database when authentication and migrations are configured.</p>
 </div>;
}
