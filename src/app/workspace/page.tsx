import Link from "next/link";
import { Activity, ArrowUpRight, Bot, BookOpen, CheckCircle2, Clock3, Cpu, FolderKanban, Leaf, ListTodo, MessageSquare, Plus, Search, ShieldCheck, Sparkles, Target, Workflow } from "lucide-react";

import { pool } from "@/lib/auth";
import { getOwnerContext } from "@/lib/server/owner";

type ProjectRow={id:string;name:string;summary:string;status:string;priority:string};
type TaskRow={id:string;title:string;status:string;priority:string;due_at:string|null;project_name:string|null};
const navGroups=[{label:"OVERVIEW",items:[["Command centre",Activity,"/workspace"],["AI assistant",MessageSquare,"/workspace/assistant"],["Agents",Bot,"/workspace/agents"]]},{label:"WORK",items:[["Projects",FolderKanban,"/workspace/projects"],["Tasks",CheckCircle2,"/workspace/tasks"],["Electronics & hardware",Cpu,"/workspace/hardware"],["Research",BookOpen,"/workspace/research"],["Knowledge",Sparkles,"/workspace/knowledge"]]},{label:"OPERATIONS",items:[["Automations",Workflow,"/workspace/automations"],["Approvals",ShieldCheck,"/workspace/approvals"],["Activity log",Clock3,"/workspace/activity"],["Integrations",Cpu,"/workspace/integrations"]]}] as const;
const specialists=["Chief of Staff","Project & Engineering","Research & Learning","Communications","Business Operations","Computer & Infrastructure","Knowledge & Memory","Voice Companion","Agriculture & IoT","Finance & Administration"];
export const dynamic="force-dynamic";
export default async function WorkspacePage(){
 let projects:ProjectRow[]=[]; let tasks:TaskRow[]=[]; let counts={projects:0,tasks:0,active:0,done:0}; let storageReady=false;
 const owner=await getOwnerContext();
 const isPublicPreview=!owner.ok;
 if(owner.ok){
  try{
   const [p,t,summary]=await Promise.all([
    pool.query<ProjectRow>("SELECT id,name,summary,status,priority FROM personal_projects WHERE owner_id=$1 AND archived_at IS NULL ORDER BY updated_at DESC LIMIT 6",[owner.ownerId]),
    pool.query<TaskRow>("SELECT t.id,t.title,t.status,t.priority,t.due_at,p.name AS project_name FROM personal_tasks t LEFT JOIN personal_projects p ON p.id=t.project_id AND p.owner_id=t.owner_id WHERE t.owner_id=$1 ORDER BY CASE t.status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 WHEN 'blocked' THEN 2 ELSE 3 END,t.due_at ASC NULLS LAST,t.created_at DESC LIMIT 6",[owner.ownerId]),
    pool.query<{projects:number;tasks:number;active:number;done:number}>("SELECT (SELECT count(*)::int FROM personal_projects WHERE owner_id=$1 AND archived_at IS NULL) AS projects,(SELECT count(*)::int FROM personal_tasks WHERE owner_id=$1) AS tasks,(SELECT count(*)::int FROM personal_tasks WHERE owner_id=$1 AND status='in_progress') AS active,(SELECT count(*)::int FROM personal_tasks WHERE owner_id=$1 AND status='done') AS done",[owner.ownerId])
   ]);
   projects=p.rows; tasks=t.rows; counts=summary.rows[0]; storageReady=true;
  }catch{storageReady=false;}
 }
 const greeting=new Intl.DateTimeFormat("en-US",{weekday:"long",month:"short",day:"numeric",timeZone:"Asia/Kathmandu"}).format(new Date()).toUpperCase();
 return <div className="shell">
  <aside className="sidebar">
   <Link href="/" className="brand"><span className="brand-mark">BB</span><span><span className="brand-name">BIKASH OS</span><span className="brand-sub" style={{display:"block"}}>PERSONAL OPERATING SYSTEM</span></span></Link>
   {navGroups.map(g=><div key={g.label}><div className="nav-label">{g.label}</div>{g.items.map(([label,Icon,href])=><Link key={label} href={href} className={"nav-link "+(label==="Command centre"?"active":"")}><Icon size={15}/>{label}</Link>)}</div>)}
   <div className="sidebar-bottom"><div className="nav-label">SYSTEM</div><Link className="nav-link" href="/workspace/settings"><Cpu size={15}/>Settings</Link><Link className="nav-link" href="/login"><ShieldCheck size={15}/>Owner sign-in</Link><div className="profile-chip"><div className="avatar">BB</div><div><div className="profile-name">Bikash Bhattarai</div><div className="profile-role">Owner workspace</div></div></div></div>
  </aside>
  <main className="main">
   <header className="topbar"><Link href="/" className="crumb"><span aria-hidden="true">←</span> BACK TO PUBLIC SITE <span style={{color:"#4f6079"}}>/</span> COMMAND CENTRE</Link><div className="top-actions"><span><span className="status-dot"/>{storageReady?"LIVE WORKSPACE DATA":isPublicPreview?"PUBLIC PREVIEW · OWNER DATA LOCKED":"DATABASE SETUP REQUIRED"}</span><Link className="icon-button" href="/workspace/assistant"><Search size={14}/></Link></div></header>
   <div className="content">
    <div className="welcome"><div><div className="eyebrow">{greeting} · NEPAL TIME</div><h1>Your work, in one place.</h1><p>Projects, tasks and your AI specialist team—built around the work you actually do.</p></div><div className="date-chip">BIKASH PERSONAL OS</div></div>
    {!storageReady&&<div className="panel" style={{marginBottom:16,borderColor:"rgba(99,242,220,.2)",background:"rgba(10,67,73,.16)"}}><div style={{display:"flex",gap:10,alignItems:"flex-start"}}><ShieldCheck size={17} color="#63f2dc"/><div><div className="panel-title">{isPublicPreview?"Private workspace data is protected":"Workspace database is not ready yet"}</div><p className="panel-sub" style={{lineHeight:1.7}}>{isPublicPreview?"You can browse every module in this public preview. Real project and task records remain private until owner sign-in is enabled.":"The dashboard shows only verified owner records. Configure the dedicated database and migrations before using live data."}</p><Link href="/login" className="text-link">OWNER SIGN-IN <ArrowUpRight size={11} style={{display:"inline"}}/></Link></div></div></div>}
    <section className="stats">
     <div className="stat"><div className="stat-head">Your projects <span className="stat-icon"><FolderKanban size={14}/></span></div><div className="stat-value">{storageReady?counts.projects:"—"}</div><div className="stat-foot">Active portfolio records</div></div>
     <div className="stat"><div className="stat-head">Open tasks <span className="stat-icon"><Target size={14}/></span></div><div className="stat-value">{storageReady?counts.tasks-counts.done:"—"}</div><div className="stat-foot">Tasks not yet completed</div></div>
     <div className="stat"><div className="stat-head">In progress <span className="stat-icon"><Activity size={14}/></span></div><div className="stat-value">{storageReady?counts.active:"—"}</div><div className="stat-foot">Currently being worked on</div></div>
     <div className="stat"><div className="stat-head">Completed tasks <span className="stat-icon"><CheckCircle2 size={14}/></span></div><div className="stat-value">{storageReady?counts.done:"—"}</div><div className="stat-foot">Saved completion records</div></div>
    </section>
    <div className="dashboard-grid">
     <div style={{display:"grid",gap:15,alignContent:"start"}}>
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Your task queue</div><div className="panel-sub">Real tasks from your workspace database</div></div><Link href="/workspace/tasks" className="text-link">ALL TASKS <ArrowUpRight size={11} style={{display:"inline"}}/></Link></div>
       {!storageReady||tasks.length===0?<div style={{padding:"22px 8px",textAlign:"center"}}><ListTodo size={22} color="#91baff"/><div className="panel-title" style={{marginTop:9}}>No task records yet</div><p className="panel-sub" style={{lineHeight:1.7}}>Add a task to start tracking priorities and progress.</p><Link href="/workspace/tasks" className="text-link">CREATE A TASK <Plus size={11} style={{display:"inline"}}/></Link></div>:tasks.map(t=><div className="task-row" key={t.id}><span className="task-check"/><div style={{minWidth:0}}><div className="task-name">{t.title}</div><div className="task-meta">{t.project_name||"Unassigned"} · {t.status.replace("_"," ").toUpperCase()}{t.due_at?" · "+new Date(t.due_at).toLocaleDateString("en-US",{timeZone:"Asia/Kathmandu"}):""}</div></div><span className="priority">{t.priority.toUpperCase()}</span></div>)}
      </section>
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Project portfolio</div><div className="panel-sub">Software · electronics · hardware · robotics · IoT · business</div></div><Link href="/workspace/projects" className="text-link">ALL PROJECTS <ArrowUpRight size={11} style={{display:"inline"}}/></Link></div>
       {!storageReady||projects.length===0?<div style={{padding:"22px 8px",textAlign:"center"}}><FolderKanban size={22} color="#91baff"/><div className="panel-title" style={{marginTop:9}}>Your portfolio starts here</div><p className="panel-sub" style={{lineHeight:1.7}}>Add each real project once, then connect tasks, decisions and agent plans.</p><Link href="/workspace/projects" className="text-link">ADD A PROJECT <Plus size={11} style={{display:"inline"}}/></Link></div>:projects.map(p=><div className="agent-row" key={p.id}><span className="agent-icon"><FolderKanban size={15}/></span><div><div className="agent-name">{p.name}</div><div className="agent-desc">{p.summary||p.status+" · "+p.priority}</div></div><span className="agent-state">{p.status.toUpperCase()}</span></div>)}
      </section>
     </div>
     <div style={{display:"grid",gap:15,alignContent:"start"}}>
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Specialist agent team</div><div className="panel-sub">10 defined roles · execution runtime not yet active</div></div><Link href="/workspace/agents" className="text-link">TEAM <ArrowUpRight size={11} style={{display:"inline"}}/></Link></div>
       {specialists.map((name,i)=><div className="agent-row" key={name}><span className="agent-icon"><Bot size={15}/></span><div><div className="agent-name">{name}</div><div className="agent-desc">{i===0?"Coordinates planning and delegates work":"Dedicated domain specialist"}</div></div><span className="agent-state" style={{color:"#f4c879"}}>DESIGNED</span></div>)}
      </section>
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Quick actions</div><div className="panel-sub">Start with a real record</div></div></div><div className="quick-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}><Link className="quick-action" href="/workspace/projects"><FolderKanban size={16}/><strong>New project</strong>Portfolio record</Link><Link className="quick-action" href="/workspace/tasks"><Plus size={16}/><strong>New task</strong>Capture work</Link><Link className="quick-action" href="/workspace/assistant"><MessageSquare size={16}/><strong>AI planning</strong>Plan-first workflow</Link><Link className="quick-action" href="/workspace/research"><BookOpen size={16}/><strong>Research</strong>Evidence and learning</Link></div></section>
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Work categories</div><div className="panel-sub">The domains your OS should organise</div></div></div>{[["Software & web platforms",Cpu],["Electronics & embedded systems",Cpu],["Robotics & physical AI",Bot],["Agriculture & greenhouse IoT",Leaf],["Business & operations",Activity]].map(([name,Icon])=>{const I=Icon as typeof Cpu;return <div className="agent-row" key={name as string}><span className="agent-icon"><I size={14}/></span><div className="agent-name">{name as string}</div></div>})}</section>
     </div>
    </div>
    <div className="footer-note">BIKASH PERSONAL OS · PUBLIC INTERFACE PREVIEW · PRIVATE DATA REMAINS OWNER-ONLY</div>
   </div>
   <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation"><Link className="active" href="/workspace"><Activity/><span>Home</span></Link><Link href="/workspace/projects"><FolderKanban/><span>Projects</span></Link><Link href="/workspace/tasks"><ListTodo/><span>Tasks</span></Link><Link href="/workspace/assistant"><MessageSquare/><span>AI assistant</span></Link><Link href="/workspace/research"><Search/><span>Research</span></Link></nav>
  </main>
 </div>;
}