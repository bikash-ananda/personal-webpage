import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Bot, BookOpen, CheckCircle2, Clock3, FolderKanban, MessageSquare, Search, Settings2, ShieldCheck, Sparkles, Workflow, Cpu, Activity } from "lucide-react";
import { notFound } from "next/navigation";

const sections: Record<string, { title: string; eyebrow: string; description: string; icon: typeof Activity; capabilities: string[] }> = {
  assistant: { title: "AI assistant", eyebrow: "INTELLIGENCE / CONVERSATION", description: "A single place to think, plan and work with your personal AI team. Model routing and conversation persistence will be introduced in the next release.", icon: MessageSquare, capabilities: ["Context-aware conversations", "Plan-first task execution", "Hosted and local model routing", "Traceable runs and cancellation"] },
  agents: { title: "Specialist agents", eyebrow: "INTELLIGENCE / TEAM", description: "A coordinated team of specialists with explicit roles, scoped tools and approval boundaries.", icon: Bot, capabilities: ["Chief of Staff & orchestration", "Project and engineering", "Research and learning", "Communications and business operations", "Infrastructure, knowledge, voice, IoT and finance"] },
  projects: { title: "Projects", eyebrow: "WORK / PORTFOLIO", description: "Bring engineering, business and personal initiatives into one connected project system.", icon: FolderKanban, capabilities: ["Project briefs and outcomes", "Milestones and delivery health", "Linked tasks and decisions", "Repository and document references"] },
  tasks: { title: "Tasks", eyebrow: "WORK / EXECUTION", description: "A unified execution queue with priorities, due dates, ownership and project context.", icon: CheckCircle2, capabilities: ["Capture and prioritise work", "Daily and weekly planning", "Dependencies and recurring tasks", "Completion history"] },
  research: { title: "Research", eyebrow: "KNOWLEDGE / DISCOVERY", description: "A research workspace for evidence-led investigation, synthesis and learning.", icon: Search, capabilities: ["Research briefs and questions", "Source provenance and confidence", "Structured summaries", "Learning paths and reading lists"] },
  knowledge: { title: "Knowledge library", eyebrow: "KNOWLEDGE / MEMORY", description: "A searchable, inspectable memory system with provenance, scope and retention controls.", icon: BookOpen, capabilities: ["Profile and project memory", "Decision and episodic records", "Document and source ingestion", "Correction, export and deletion controls"] },
  automations: { title: "Automations", eyebrow: "OPERATIONS / SCHEDULING", description: "Scheduled and event-driven workflows with bounded permissions and execution history.", icon: Workflow, capabilities: ["Recurring routines", "Event triggers", "Retry and failure visibility", "Pause and emergency stop"] },
  approvals: { title: "Approvals", eyebrow: "OPERATIONS / POLICY", description: "Review the exact action, target and payload before consequential work is allowed to proceed.", icon: ShieldCheck, capabilities: ["Action-specific approval", "Expiry and payload binding", "Risk and impact preview", "Append-only audit trail"] },
  activity: { title: "Activity log", eyebrow: "OPERATIONS / AUDIT", description: "A transparent record of plans, tool calls, changes and outcomes across your workspace.", icon: Clock3, capabilities: ["Agent run history", "Tool and integration events", "Approval decisions", "Errors and recovery details"] },
  integrations: { title: "Integrations", eyebrow: "OPERATIONS / CONNECTIONS", description: "Connect external services through least-privilege permissions and explicit scopes.", icon: Cpu, capabilities: ["GitHub repositories", "Google Workspace", "Browser and MCP tools", "Local computer and IoT gateways"] },
  settings: { title: "Settings", eyebrow: "SYSTEM / CONTROL", description: "Configure identity, privacy, models, notifications and security policies.", icon: Settings2, capabilities: ["Profile and session security", "Model and privacy preferences", "Agent permissions", "Data export and retention"] },
};
export default async function WorkspaceSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = sections[section];
  if (!item) notFound();
  const Icon = item.icon;
  return <main className="main" style={{marginLeft:0,minHeight:"100vh"}}>
    <header className="topbar"><Link href="/workspace" className="crumb"><ArrowLeft size={13} style={{display:"inline",verticalAlign:"middle",marginRight:8}}/>BACK TO COMMAND CENTRE</Link><div className="top-actions"><span className="mono" style={{fontSize:10}}>MODULE PREVIEW</span></div></header>
    <div className="content" style={{maxWidth:1000}}>
      <div className="eyebrow">{item.eyebrow}</div>
      <div style={{display:"flex",alignItems:"center",gap:15,marginTop:15}}><span className="stat-icon" style={{width:44,height:44}}><Icon size={21}/></span><h1 style={{font:"700 30px Manrope",letterSpacing:"-.04em",margin:0}}>{item.title}</h1></div>
      <p className="muted" style={{fontSize:13,lineHeight:1.8,maxWidth:680,marginTop:15}}>{item.description}</p>
      <section className="panel" style={{marginTop:28,maxWidth:720}}>
        <div className="panel-head"><div><div className="panel-title">Planned capabilities</div><div className="panel-sub">Module scope for the next implementation stages</div></div><span className="text-link">ROADMAP</span></div>
        {item.capabilities.map((cap)=><div className="task-row" key={cap}><span className="task-check"/><div className="task-name">{cap}</div><span className="priority" style={{color:"#91baff"}}>PLANNED</span></div>)}
      </section>
      <div className="panel" style={{marginTop:14,maxWidth:720,background:"rgba(244,200,121,.045)",borderColor:"rgba(244,200,121,.18)"}}>
        <div style={{display:"flex",gap:11,alignItems:"flex-start"}}><Sparkles size={17} color="#f4c879"/><div><div className="panel-title">Module scaffold — not yet connected</div><p className="panel-sub" style={{lineHeight:1.7}}>This screen documents the intended module scope. Authentication, data persistence and live actions will be enabled only after their security and test requirements are met.</p></div></div>
      </div>
      <div style={{marginTop:22}}><Link href="/workspace" className="text-link">← COMMAND CENTRE <ArrowUpRight size={11} style={{display:"inline"}}/></Link></div>
    </div>
  </main>;
}
