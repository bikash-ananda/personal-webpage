import Link from "next/link";
import { Home, ListTodo, Search as SearchIcon } from "lucide-react";
import { Activity, ArrowUpRight, Bell, BookOpen, Bot, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronRight, CircleDot, Clock3, Command, Cpu, FolderKanban, GitBranch, Leaf, MessageSquare, Plus, Search, Settings2, ShieldCheck, Sparkles, Target, Workflow } from "lucide-react";

const tasks = [
  {title:"Define the first Personal OS release boundary",project:"Personal AI OS · Architecture",due:"TODAY",priority:"HIGH"},
  {title:"Review wildlife platform research content pipeline",project:"Wildlife Management · Product",due:"TODAY",priority:"MEDIUM"},
  {title:"Prepare greenhouse device connectivity checklist",project:"Digital Agriculture · IoT",due:"TOMORROW",priority:"MEDIUM"},
];
const agents = [
  {icon:Target,name:"Chief of Staff",desc:"Priorities, planning & coordination",state:"READY"},
  {icon:GitBranch,name:"Engineering",desc:"Code, systems & delivery",state:"READY"},
  {icon:BookOpen,name:"Research",desc:"Evidence, learning & synthesis",state:"READY"},
  {icon:BriefcaseBusiness,name:"Business Operations",desc:"Customers, workflows & reports",state:"PLANNED"},
];
const navGroups = [
  {label:"OVERVIEW",items:[["Command centre",Activity],["AI assistant",MessageSquare],["Agents",Bot]]},
  {label:"WORK",items:[["Projects",FolderKanban],["Tasks",CheckCircle2],["Research",BookOpen],["Knowledge",Sparkles]]},
  {label:"OPERATIONS",items:[["Automations",Workflow],["Approvals",ShieldCheck],["Activity log",Clock3],["Integrations",Cpu]]},
 ] as const;
const sectionHref: Record<string, string> = { "AI assistant": "assistant", "Agents": "agents", "Projects": "projects", "Tasks": "tasks", "Research": "research", "Knowledge": "knowledge", "Automations": "automations", "Approvals": "approvals", "Activity log": "activity", "Integrations": "integrations" };
export default function WorkspacePage(){
  return <div className="shell">
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-mark">BB</span><span><span className="brand-name">BIKASH OS</span><span className="brand-sub" style={{display:"block"}}>PERSONAL OPERATING SYSTEM</span></span></Link>
      {navGroups.map(g=><div key={g.label}><div className="nav-label">{g.label}</div>{g.items.map(([label,Icon],i)=>{const I=Icon as typeof Activity;return <Link key={label as string} href={label==="Command centre"?"/workspace":`/workspace/${sectionHref[String(label)]}`} className={"nav-link "+(label==="Command centre"?"active":"")}><I size={15}/>{label as string}{label==="Approvals"?<span className="mono" style={{marginLeft:"auto",fontSize:9,color:"#f4c879"}}>0</span>:null}</Link>})}</div>)}
      <div className="sidebar-bottom"><div className="nav-label">SYSTEM</div><Link className="nav-link" href="/workspace/settings"><Settings2 size={15}/>Settings</Link><div className="profile-chip"><div className="avatar">BB</div><div><div className="profile-name">Bikash Bhattarai</div><div className="profile-role">Owner workspace · Preview</div></div><ChevronRight size={14} style={{marginLeft:"auto",color:"#64738d"}}/></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">PERSONAL OS <span style={{color:"#4f6079"}}>/</span> COMMAND CENTRE</div><div className="top-actions"><span><span className="status-dot"/>SYSTEM PREVIEW</span><span className="icon-button"><Search size={14}/></span><span className="icon-button"><Bell size={14}/></span></div></header>
      <div className="content">
        <div className="welcome"><div><div className="eyebrow">TUESDAY · YOUR OPERATING VIEW</div><h1>Good to have you here, Bikash.</h1><p>Your work, projects and AI team—brought into one place.</p></div><div className="date-chip">17 NOV 2026 · NEPAL TIME</div></div>
        <section className="stats">
          <div className="stat"><div className="stat-head">Active projects <span className="stat-icon"><FolderKanban size={14}/></span></div><div className="stat-value">04</div><div className="stat-foot">Across engineering & business</div></div>
          <div className="stat"><div className="stat-head">Open priorities <span className="stat-icon"><Target size={14}/></span></div><div className="stat-value">08</div><div className="stat-foot"><span className="positive">3 due today</span> · 5 upcoming</div></div>
          <div className="stat"><div className="stat-head">AI specialists <span className="stat-icon"><Bot size={14}/></span></div><div className="stat-value">10</div><div className="stat-foot">Designed · runtime not connected</div></div>
          <div className="stat"><div className="stat-head">Pending approvals <span className="stat-icon"><ShieldCheck size={14}/></span></div><div className="stat-value">00</div><div className="stat-foot">No actions awaiting permission</div></div>
        </section>
        <div className="dashboard-grid">
          <div style={{display:"grid",gap:15,alignContent:"start"}}>
            <section className="panel"><div className="panel-head"><div><div className="panel-title">Today's focus</div><div className="panel-sub">One meaningful outcome to move forward</div></div><span className="text-link">DAILY BRIEFING</span></div>
              <div className="focus-card"><div className="focus-top"><span className="focus-tag">✦ PRIMARY FOCUS</span><span className="mono" style={{fontSize:9,color:"#9bf0c7"}}>IN PROGRESS</span></div><h3>Lay the foundation for a truly unified Personal AI OS</h3><p>Build the product shell first, then establish identity, durable data, the model gateway and safe agent execution. Keep production infrastructure untouched until the staged release is verified.</p><div className="focus-meta"><span>PERSONAL AI OS</span><span>·</span><span>FOUNDATION RELEASE</span></div></div>
              <div className="panel-head" style={{marginTop:20,marginBottom:5}}><div className="panel-title">Priority queue</div><Link className="text-link" href="/workspace">VIEW ALL <ArrowUpRight size={11} style={{display:"inline"}}/></Link></div>
              {tasks.map(t=><div className="task-row" key={t.title}><span className="task-check"/><div><div className="task-name">{t.title}</div><div className="task-meta">{t.project} · {t.due}</div></div><span className="priority">{t.priority}</span></div>)}
            </section>
            <section className="panel"><div className="panel-head"><div><div className="panel-title">Quick actions</div><div className="panel-sub">Common starting points for your day</div></div></div><div className="quick-grid"><Link className="quick-action" href="/workspace"><Plus size={16}/><strong>New task</strong>Capture an action</Link><Link className="quick-action" href="/workspace"><MessageSquare size={16}/><strong>Ask assistant</strong>Think something through</Link><Link className="quick-action" href="/workspace"><Search size={16}/><strong>Research</strong>Explore a question</Link></div></section>
          </div>
          <div style={{display:"grid",gap:15,alignContent:"start"}}>
            <section className="panel"><div className="panel-head"><div><div className="panel-title">Your specialist team</div><div className="panel-sub">10 role-based agents · staged activation</div></div><Link href="/workspace" className="text-link">TEAM <ArrowUpRight size={11} style={{display:"inline"}}/></Link></div>
              {agents.map(a=>{const I=a.icon;return <div className="agent-row" key={a.name}><span className="agent-icon"><I size={15}/></span><div><div className="agent-name">{a.name}</div><div className="agent-desc">{a.desc}</div></div><span className="agent-state">{a.state}</span></div>})}
            </section>
            <section className="panel"><div className="panel-head"><div><div className="panel-title">Connected workstreams</div><div className="panel-sub">Your active operating landscape</div></div><span className="text-link">4 PROJECTS</span></div>
              {[["Personal AI OS","Product architecture",Sparkles],["BNB Machinery","Commerce platform",Cpu],["Wildlife Management","Civic technology",Activity],["Digital Agriculture","Greenhouse & IoT",Leaf]].map(([n,d,I])=>{const Icon=I as typeof Activity;return <div className="agent-row" key={n as string}><span className="agent-icon"><Icon size={15}/></span><div><div className="agent-name">{n as string}</div><div className="agent-desc">{d as string}</div></div><CircleDot size={11} color="#9bf0c7" style={{marginLeft:"auto"}}/></div>})}
            </section>
            <section className="panel"><div className="panel-head"><div><div className="panel-title">Recent activity</div><div className="panel-sub">A transparent record of progress</div></div></div><div className="activity"><div className="activity-line"/><div><div className="activity-copy">Product architecture and delivery roadmap established</div><div className="activity-time">TODAY · PERSONAL AI OS</div></div></div><div className="activity"><div className="activity-line"/><div><div className="activity-copy">Integration branch created; main branch preserved</div><div className="activity-time">TODAY · GITHUB</div></div></div><div className="activity"><div className="activity-line"/><div><div className="activity-copy">Legacy project repositories reviewed as reference material</div><div className="activity-time">TODAY · ENGINEERING</div></div></div></section>
          </div>
        </div>
        <div className="footer-note">BIKASH OS · PRIVATE WORKSPACE PREVIEW · AUTHENTICATION & LIVE DATA NOT YET ENABLED</div>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation"><Link className="active" href="/workspace"><Home/><span>Home</span></Link><Link href="/workspace/projects"><FolderKanban/><span>Projects</span></Link><Link href="/workspace/tasks"><ListTodo/><span>Tasks</span></Link><Link href="/workspace/assistant"><MessageSquare/><span>AI assistant</span></Link><Link href="/workspace/research"><SearchIcon/><span>Research</span></Link></nav>
    </main>
  </div>
      </div>
    </main>
  </div>
}
