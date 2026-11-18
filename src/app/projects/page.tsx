import PublicSubpage from "@/app/components/PublicSubpage";

export default function ProjectsPage() {
  return <PublicSubpage
    number="02"
    label="SELECTED PROJECTS"
    title="Ideas turned into"
    emphasis="working systems."
    intro="A portfolio of ongoing work across personal AI, engineering, digital agriculture, wildlife management and business platforms. Descriptions will be expanded as milestones and verified results are published."
    cards={[
      { eyebrow: "PERSONAL AI · PRODUCTIVITY", title: "Bikash Personal AI OS", description: "A private digital workspace intended to coordinate projects, tasks, knowledge and specialist AI agents with controlled access to tools.", tags: ["Personal AI", "Agent workflows", "Automation"] },
      { eyebrow: "AGRITECH · IOT", title: "Digital Agriculture & Smart Greenhouse", description: "An agricultural monitoring and automation platform connecting field devices, greenhouse sensors and practical farm workflows.", tags: ["ESP32", "Greenhouse", "IoT"] },
      { eyebrow: "CONSERVATION · CIVIC TECHNOLOGY", title: "Nepal Wildlife Management System", description: "A digital approach to wildlife information, incident reporting, community communication and coordinated response.", tags: ["Wildlife reporting", "Data platform", "Community"] },
      { eyebrow: "ENGINEERING · COMMERCE", title: "BNB Machinery", description: "A web platform for machinery and equipment operations, with commerce and business-management capabilities.", tags: ["Full-stack", "Business systems", "Web platform"] },
      { eyebrow: "BUSINESS OPERATIONS", title: "BEOS — MITRA Solution", description: "A business operations platform supporting structured workflows and digital service delivery.", tags: ["Operations", "Web application", "Workflow"] },
      { eyebrow: "AGRICULTURE · MOBILE", title: "Smart Krishi", description: "A farmer-focused application concept connecting agricultural information, farm devices and field reporting workflows.", tags: ["Farmer tools", "Mobile app", "Connected devices"] },
    ]}
  />;
}
