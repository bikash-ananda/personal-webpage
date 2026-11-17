import Link from "next/link";
import { ArrowUpRight, Cpu, FlaskConical, Leaf, Radio, Workflow } from "lucide-react";

const projects = [
  { icon: Cpu, name: "Personal AI OS", type: "AI · AUTOMATION", desc: "A private digital command centre connecting projects, knowledge, agents and everyday execution." },
  { icon: Leaf, name: "Digital Agriculture", type: "IOT · PHYSICAL AI", desc: "Connected greenhouse monitoring, field devices and intelligent agricultural workflows." },
  { icon: Radio, name: "Wildlife Management", type: "CIVIC TECH · WEB", desc: "A digital platform for human–wildlife conflict information, reporting and coordination." },
];

export default function HomePage() {
  return <main className="public-wrap">
    <nav className="public-nav">
      <Link href="/" className="brand" style={{padding:0}}><span className="brand-mark">BB</span><span><span className="brand-name">BIKASH BHATTARAI</span><span className="brand-sub" style={{display:"block"}}>ENGINEERING · SYSTEMS · IDEAS</span></span></Link>
      <div className="public-links"><a href="#about">About</a><a href="#work">Selected work</a><a href="#approach">Approach</a><Link href="/workspace">Workspace ↗</Link></div>
    </nav>
    <section className="public-hero">
      <div className="eyebrow">ELECTRICAL & ELECTRONIC ENGINEER · BUILDER</div>
      <h1>Building useful things<br/>at the edge of <span>ideas.</span></h1>
      <p>I work across software, intelligent systems, robotics and agriculture—turning complex problems into practical tools, connected products and real-world outcomes.</p>
      <Link className="public-cta" href="/workspace">Enter personal workspace <ArrowUpRight size={15}/></Link>
    </section>
    <section id="about" className="public-section">
      <div className="eyebrow">01 / ABOUT</div><h2>Engineering across the digital and physical world.</h2>
      <p className="muted" style={{maxWidth:700,lineHeight:1.8}}>My work brings together full-stack development, electronics, automation, physical AI, robotics and applied research. I enjoy building systems that connect people, information, machines and meaningful work.</p>
    </section>
    <section id="work" className="public-section">
      <div className="eyebrow">02 / SELECTED WORK</div><h2>Projects in motion</h2>
      <div className="project-grid">{projects.map((p) => { const Icon=p.icon; return <article className="project-card" key={p.name}><Icon size={19} color="#9bf0c7"/><div className="eyebrow" style={{marginTop:17}}>{p.type}</div><h3>{p.name}</h3><p>{p.desc}</p></article> })}</div>
    </section>
    <section id="approach" className="public-section">
      <div className="eyebrow">03 / HOW I WORK</div><h2>Research deeply. Build deliberately. Improve continuously.</h2>
      <div className="project-grid"><div className="project-card"><FlaskConical color="#91baff"/><h3>Explore</h3><p>Understand the problem, study evidence and map the system.</p></div><div className="project-card"><Workflow color="#91baff"/><h3>Engineer</h3><p>Design reliable architecture and turn ideas into working products.</p></div><div className="project-card"><ArrowUpRight color="#91baff"/><h3>Deliver</h3><p>Test in the real world, learn from users and keep improving.</p></div></div>
    </section>
    <footer className="footer-note">© {new Date().getFullYear()} BIKASH BHATTARAI · BIKASHBHATTARAI.COM.NP</footer>
  </main>;
}
