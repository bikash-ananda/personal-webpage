import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

type PublicCard = {
  eyebrow: string;
  title: string;
  description: string;
  tags?: string[];
};

type PublicSubpageProps = {
  number: string;
  label: string;
  title: string;
  emphasis: string;
  intro: string;
  cards?: PublicCard[];
  note?: string;
};

const links = [
  ["Home", "/"],
  ["About", "/about"],
  ["Projects", "/projects"],
  ["Research", "/research"],
  ["Writing", "/writing"],
  ["Contact", "/contact"],
] as const;

export default function PublicSubpage({
  number,
  label,
  title,
  emphasis,
  intro,
  cards = [],
  note,
}: PublicSubpageProps) {
  return (
    <main className="portfolio public-subpage">
      <nav className="portfolio-nav" aria-label="Main navigation">
        <Link href="/" className="portfolio-brand">
          <span className="portfolio-monogram">BB</span>
          <span><strong>BIKASH BHATTARAI</strong><small>ENGINEERING · SYSTEMS · IDEAS</small></span>
        </Link>
        <div className="portfolio-nav-links">
          {links.map(([name, href]) => <Link href={href} key={href}>{name}</Link>)}
          <Link href="/workspace" className="portfolio-nav-cta">Explore workspace <ArrowUpRight size={14} /></Link>
        </div>
      </nav>

      <header className="public-page-hero">
        <Link href="/" className="public-back-link"><ArrowLeft size={14} /> BACK TO HOME</Link>
        <div className="section-index">{number} <span>/</span> {label}</div>
        <h1>{title}<br /><em>{emphasis}</em></h1>
        <p>{intro}</p>
      </header>

      {cards.length > 0 && (
        <section className="public-page-cards" aria-label={label}>
          {cards.map((card) => (
            <article className="portfolio-project" key={card.title}>
              <div className="project-category">{card.eyebrow}</div>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              {card.tags && <div className="project-tags">{card.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
            </article>
          ))}
        </section>
      )}

      {note && <section className="public-page-note"><p>{note}</p></section>}

      <footer className="portfolio-footer public-page-footer">
        <div className="footer-main">
          <div><div className="portfolio-kicker"><span /> BUILD · CONNECT · IMPROVE</div><h2>Explore the work.<br /><em>Stay curious.</em></h2></div>
          <Link href="/workspace" className="portfolio-primary">Open the workspace <ArrowRight size={15} /></Link>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} BIKASH BHATTARAI</span><span>BIKASHBHATTARAI.COM.NP</span><span>NEPAL</span></div>
      </footer>
    </main>
  );
}
