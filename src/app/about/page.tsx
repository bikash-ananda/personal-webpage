import PublicSubpage from "@/app/components/PublicSubpage";

export default function AboutPage() {
  return <PublicSubpage
    number="01"
    label="ABOUT"
    title="Curious by nature."
    emphasis="Engineer by practice."
    intro="I am an electrical and electronic engineer interested in building useful systems across software, electronics, robotics, automation and applied technology."
    cards={[
      { eyebrow: "ENGINEERING", title: "Electrical & electronics", description: "An engineering foundation for understanding circuits, embedded devices, sensing and the physical systems around us.", tags: ["Electronics", "Embedded systems", "IoT"] },
      { eyebrow: "INTELLIGENT SYSTEMS", title: "Software, AI & robotics", description: "Exploring how software, data and intelligent models can work together with machines and real-world environments.", tags: ["Full-stack development", "AI agents", "Robotics"] },
      { eyebrow: "APPLIED TECHNOLOGY", title: "Technology with practical value", description: "Bringing engineering into agriculture, business operations and community-facing solutions.", tags: ["Agritech", "Automation", "Applied research"] },
    ]}
    note="This profile is a concise introduction. Project pages will be expanded with verified outcomes, technical details and supporting material as each project is documented."
  />;
}
