import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Cpu, Leaf, Radio, Workflow, CircuitBoard, Bot, Sprout } from "lucide-react";

const projects = [
  { icon: Cpu, number: "01", name: "Personal AI OS", category: "AI · PRODUCTIVITY · AUTOMATION", description: "A private digital command centre that brings projects, knowledge, specialist agents and everyday execution into one connected workspace.", tags: ["AI agents", "Project systems", "Automation"] },
  { icon: Leaf, number: "02", name: "Digital Agriculture", category: "IOT · EMBEDDED · AGRITECH", description: "Connected greenhouse monitoring and practical field automation, bringing sensors, devices and useful intelligence closer to growers.", tags: ["ESP32", "Smart greenhouse", "IoT"] },
  { icon: Radio, number: "03", name: "Wildlife Management", category: "CIVIC TECH · CONSERVATION", description: "A digital platform for wildlife information, human–wildlife conflict reporting, community guidance and coordinated response.", tags: ["Wildlife data", "Public service", "Web platform"] },
];

const disciplines = [
  { icon: CircuitBoard, title: "Electronics & embedded systems", detail: "From circuits and microcontrollers to connected devices." },
  { icon: Bot, title: "Robotics & physical AI", detail: "Intelligent systems that sense, decide and act in the real world." },
  { icon: Sprout, title: "Agriculture & applied technology", detail: "Engineering practical solutions for farms and communities." },
  { icon: Workflow, title: "Software & automation", detail: "Full-stack platforms, integrations and reliable workflows." },
];

export default function HomePage() {
  return <main className="portfolio">
    <nav className="portfolio-nav">
      <Link href="/" className="portfolio-brand"><span className="portfolio-monogram">BB</span><span><strong>BIKASH BHATTARAI</strong><small>ENGINEERING · SYSTEMS · IDEAS</small></span></Link>
      <div className="portfolio-nav-links"><a href="#work">Selected work</a><a href="#expertise">Expertise</a><a href="#approach">Approach</a><Link href="/login" className="portfolio-nav-cta">Private workspace <ArrowUpRight size={14}/></Link></div>
    </nav>

    <section className="portfolio-hero">
      <div className="portfolio-hero-copy">
        <div className="portfolio-kicker"><span/> ELECTRICAL & ELECTRONIC ENGINEER · BUILDER</div>
        <h1>Engineering ideas<br/>into <em>real-world</em><br/>solutions.</h1>
        <p className="portfolio-lead">I work across software, electronics, robotics and intelligent agriculture—connecting the digital and physical worlds to build useful things.</p>
        <div className="portfolio-hero-actions"><a className="portfolio-primary" href="#work">Explore my work <ArrowDownRight size={16}/></a><a className="portfolio-secondary" href="#about">A little about me <ArrowRight size={15}/></a></div>
      </div>
      <div className="portfolio-visual" aria-label="Engineering disciplines illustration">
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/>
        <div className="visual-core"><span>BB</span><small>BUILD · CONNECT · IMPROVE</small></div>
        <div className="visual-node node-a"><Cpu/><span>ENGINEERING</span></div>
        <div className="visual-node node-b"><Bot/><span>INTELLIGENCE</span></div>
        <div className="visual-node node-c"><Sprout/><span>IMPACT</span></div>
        <div className="visual-caption">IDEAS IN MOTION <span>·</span> NEPAL</div>
      </div>
      <div className="portfolio-scroll">SCROLL TO EXPLORE <span/></div>
    </section>

    <section id="about" className="portfolio-intro">
      <div className="section-index">01 <span>/</span> THE PERSON</div>
      <div className="intro-copy"><h2>Curious by nature.<br/><em>Engineer</em> by practice.</h2><div><p>I’m an electrical and electronic engineer with a strong interest in full-stack development, physical AI, robotics, automation and applied research.</p><p>My work moves between code, circuits, connected devices and real operational challenges. I enjoy learning deeply, building deliberately and improving systems through practical use.</p></div></div>
    </section>

    <section id="work" className="portfolio-work">
      <div className="section-heading"><div><div className="section-index">02 <span>/</span> SELECTED WORK</div><h2>Building things<br/>that <em>matter.</em></h2></div><p>A growing portfolio of connected projects across software, engineering and the physical world.</p></div>
      <div className="portfolio-projects">{projects.map(project => { const Icon=project.icon; return <article className="portfolio-project" key={project.number}><div className="project-topline"><span>{project.number} / FEATURED PROJECT</span><Icon size={20}/></div><div className="project-category">{project.category}</div><h3>{project.name}</h3><p>{project.description}</p><div className="project-tags">{project.tags.map(tag=><span key={tag}>{tag}</span>)}</div></article> })}</div>
    </section>

    <section id="expertise" className="portfolio-expertise">
      <div className="section-index">03 <span>/</span> AREAS OF PRACTICE</div><div className="expertise-heading"><h2>Different disciplines.<br/><em>One engineering mindset.</em></h2><p>I bring together the right tools and perspectives to solve problems that don’t fit neatly into one category.</p></div>
      <div className="expertise-grid">{disciplines.map((item,i)=>{const Icon=item.icon;return <article key={item.title}><span className="expertise-number">0{i+1}</span><Icon size={22}/><h3>{item.title}</h3><p>{item.detail}</p></article>})}</div>
    </section>

    <section id="approach" className="portfolio-approach"><div className="section-index">04 <span>/</span> HOW I WORK</div><div className="approach-content"><h2>Understand the problem.<br/>Build with purpose.<br/><em>Make it useful.</em></h2><div className="approach-steps"><div><span>01</span><strong>Explore</strong><p>Research the context, understand users and identify what matters.</p></div><div><span>02</span><strong>Engineer</strong><p>Design the system, test assumptions and turn ideas into working products.</p></div><div><span>03</span><strong>Improve</strong><p>Learn from real use, measure outcomes and keep making it better.</p></div></div></div></section>

    <footer className="portfolio-footer"><div className="footer-main"><div><div className="portfolio-kicker"><span/> LET’S BUILD SOMETHING USEFUL</div><h2>Good ideas deserve<br/><em>good engineering.</em></h2></div><Link href="/login" className="portfolio-primary">Enter private workspace <ArrowUpRight size={16}/></Link></div><div className="footer-bottom"><span>© {new Date().getFullYear()} BIKASH BHATTARAI</span><span>BIKASHBHATTARAI.COM.NP</span><span>MADE WITH CURIOSITY · NEPAL</span></div></footer>
  </main>;
}
