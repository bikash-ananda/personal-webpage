import PublicSubpage from "@/app/components/PublicSubpage";

export default function ResearchPage() {
  return <PublicSubpage
    number="03"
    label="RESEARCH & LEARNING"
    title="Understand deeply."
    emphasis="Build responsibly."
    intro="Research interests sit at the intersection of engineering and practical problems. This section will publish concise, source-backed reviews and learning notes—not unsupported claims or invented publications."
    cards={[
      { eyebrow: "AI & COMPUTING", title: "Personal AI systems and agentic workflows", description: "Model routing, memory, tool permissions, human approval and reliable orchestration for useful personal agents.", tags: ["AI agents", "Local models", "Safety"] },
      { eyebrow: "ROBOTICS & EMBEDDED", title: "Physical AI and connected devices", description: "Sensors, embedded controllers, robotics and the software architectures that connect digital decisions to physical environments.", tags: ["Robotics", "ESP32", "Edge systems"] },
      { eyebrow: "AGRICULTURE TECHNOLOGY", title: "Smart greenhouse and precision agriculture", description: "Practical sensing, monitoring, automation and decision support for growers and agricultural operations.", tags: ["Agritech", "IoT", "Automation"] },
      { eyebrow: "ENVIRONMENT & COMMUNITY", title: "Human–wildlife interaction and digital response", description: "Technology-supported reporting, information sharing and response workflows for wildlife-related incidents.", tags: ["Conservation", "Reporting", "Public information"] },
    ]}
    note="Research articles and literature reviews will be added after sources are checked and each summary is reviewed. No publication or research result is being claimed on this page yet."
  />;
}
