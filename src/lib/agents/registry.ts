export type AgentDefinition = {
  key: string;
  name: string;
  mission: string;
  capabilities: string[];
  tools: string[];
  autonomy: "plan_only" | "approval_required" | "approved_automation";
};

export const agentRegistry: AgentDefinition[] = [
  { key:"chief_of_staff",name:"Chief of Staff",mission:"Understand the owner's goals, organise priorities, create plans and coordinate specialist agents.",capabilities:["daily and weekly planning","task decomposition","delegation and progress summaries"],tools:["project_read","task_read","task_propose"],autonomy:"plan_only" },
  { key:"engineering",name:"Project & Engineering",mission:"Support software, electronics, embedded systems, hardware, robotics and system engineering.",capabilities:["technical design reviews","implementation plans","debugging and test plans"],tools:["project_read","task_read","task_propose","github_read"],autonomy:"approval_required" },
  { key:"research",name:"Research & Learning",mission:"Conduct evidence-led research, compare sources and create structured learning paths.",capabilities:["source discovery","research synthesis","learning plans"],tools:["encyclopedia_search","web_research","knowledge_read","knowledge_write"],autonomy:"plan_only" },
  { key:"communications",name:"Communications",mission:"Prepare professional messages, email replies, reports and public communications.",capabilities:["drafting","translation","tone and clarity review"],tools:["knowledge_read","draft_create"],autonomy:"approval_required" },
  { key:"business_ops",name:"Business Operations",mission:"Organise customers, markets, service delivery, sales operations and business reporting.",capabilities:["workflow mapping","customer follow-up plans","operational reporting"],tools:["project_read","task_read","task_propose"],autonomy:"approval_required" },
  { key:"infrastructure",name:"Computer & Infrastructure Operations",mission:"Assist with development environments, servers, deployments, diagnostics and recovery.",capabilities:["read-only diagnostics","deployment planning","backup and rollback plans"],tools:["github_read","server_diagnostics","server_deploy"],autonomy:"approval_required" },
  { key:"knowledge",name:"Knowledge & Memory",mission:"Maintain a traceable personal knowledge base with source, project and sensitivity context.",capabilities:["knowledge capture","retrieval","deduplication and correction"],tools:["knowledge_read","knowledge_write"],autonomy:"approval_required" },
  { key:"voice",name:"Voice Companion",mission:"Provide a conversational voice interface for planning, capture and approved workflows.",capabilities:["voice interaction","meeting notes","spoken task capture"],tools:["task_read","task_propose"],autonomy:"plan_only" },
  { key:"agriculture_iot",name:"Agriculture & IoT",mission:"Support greenhouse operations, ESP32 firmware, sensors, irrigation and agricultural automation.",capabilities:["sensor diagnostics","device configuration plans","agronomy research"],tools:["project_read","task_propose","iot_read","iot_actuate"],autonomy:"approval_required" },
  { key:"finance_admin",name:"Finance & Administration",mission:"Organise budgets, invoices, expenses and administrative records with strict privacy.",capabilities:["budget planning","expense categorisation","administrative checklists"],tools:["knowledge_read","task_propose"],autonomy:"approval_required" }
];

export function getAgent(key:string) {
  return agentRegistry.find(agent=>agent.key===key) ?? null;
}
