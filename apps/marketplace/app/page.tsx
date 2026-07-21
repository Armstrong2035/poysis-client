import Link from "next/link";
import { getAllCreators, getComingSoon, getFeatured, getTrending, getLatest, getDomains, getTopics } from "@/lib/creators";
import { FeaturedCard, TrendingCard, LatestRow, DomainLink } from "@/components/marketplace/NotebookCards";

// A catalog-drawer section label: eyebrow · hairline rule · optional note.
function Drawer({ label, note, gilt }: { label: string; note?: string; gilt?: boolean }) {
  return (
    <div className="mkt-drawer">
      <span className={`mkt-mono eyebrow${gilt ? " gilt" : ""}`}>{label}</span>
      <span className="grow" />
      {note && <span className="mkt-mono note">{note}</span>}
    </div>
  );
}

export default async function HomePage() {
  const creators = await getAllCreators();
  const comingSoon = getComingSoon();

  // The one live notebook we point "Start here" at: an explicitly featured one,
  // else the newest. Everything below it is the rest of the (real + seeded) feed.
  const topLive = getFeatured(creators) ?? creators[0] ?? null;

  // Seed the "coming soon" placeholders into the live feed so the marketplace
  // looks populated. topLive is excluded from the rails below so the start-here
  // card isn't immediately repeated. Trending seeds fill the rail; the rest
  // fill Latest (capped so it doesn't become a wall of locked rows).
  const seedTrending = comingSoon.filter((c) => c.trending);
  const seedRest = comingSoon.filter((c) => !c.trending);

  const trending = [
    ...getTrending(creators, topLive?.slug),
    ...seedTrending,
  ];
  const latest = [
    ...getLatest(creators).filter((c) => c.slug !== topLive?.slug),
    ...seedRest.slice(0, 6),
  ];
  // Browse-by-domain spans the whole (real + seeded) catalog so new domains
  // like AI or Christianity show up and aren't dead ends — search includes the
  // seeds too.
  const domains = getDomains([...creators, ...comingSoon]);
  const topics = getTopics(creators);

  return (
    <div style={{ flex: 1 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 18px 96px" }}>
        {/* Hero */}
        <div className="mkt-rise" style={{ padding: "14px 0 6px", marginBottom: 6 }}>
          <h1
            className="mkt-serif"
            style={{
              fontWeight: 600,
              fontSize: "clamp(29px,8vw,37px)",
              lineHeight: 1.08,
              letterSpacing: "-0.015em",
              textWrap: "balance",
              color: "var(--ink)",
              margin: "0 0 14px",
            }}
          >
            Get trusted answers from the world&rsquo;s best thinkers.
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.55, margin: 0, maxWidth: "42ch" }}>
            Ask specific questions and trace every answer back to the exact talk, interview, article or book it came from.
          </p>
        </div>

        {/* Topic quick-filters */}
        {topics.length > 0 && (
          <div className="mkt-rise" style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 20, marginBottom: 44, animationDelay: ".08s" }}>
            {topics.map((t) => (
              <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="mkt-chip">
                {t}
              </Link>
            ))}
          </div>
        )}

        {creators.length === 0 && comingSoon.length === 0 && (
          <div
            className="mkt-surface"
            style={{ borderRadius: 6, padding: "48px 20px", textAlign: "center", color: "var(--muted)", marginBottom: 44 }}
          >
            <div className="mkt-serif" style={{ fontSize: 18, color: "var(--ink)", marginBottom: 8 }}>No one indexed yet.</div>
            <div style={{ fontSize: 14 }}>A new entry is catalogued most days — check back soon.</div>
          </div>
        )}

        {/* Start here — the one live notebook we steer newcomers into first.
            The "Start here" cue now lives only as the badge on the card itself. */}
        {topLive && (
          <section style={{ marginBottom: 46 }}>
            <FeaturedCard creator={topLive} startHere />
          </section>
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <section style={{ marginBottom: 46 }}>
            <Drawer label="Trending" note="most consulted" />
            <div className="mkt-rail">
              {trending.map((c) => (
                <TrendingCard key={c.id} creator={c} />
              ))}
            </div>
          </section>
        )}

        {/* Latest */}
        {latest.length > 0 && (
          <section style={{ marginBottom: 46 }}>
            <Drawer label="Latest" note="freshly indexed" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {latest.map((c) => (
                <LatestRow key={c.id} creator={c} />
              ))}
            </div>
          </section>
        )}

        {/* Domains */}
        {domains.length > 0 && (
          <section style={{ marginBottom: 46 }}>
            <Drawer label="Browse by domain" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 22px" }}>
              {domains.map((d) => (
                <DomainLink key={d.name} domain={d} href={`/search?domain=${encodeURIComponent(d.name)}`} />
              ))}
            </div>
          </section>
        )}

        <div style={{ borderTop: "1px solid var(--rule-strong)", paddingTop: 20 }}>
          <span className="mkt-mono" style={{ color: "var(--faint)" }}>A new entry is catalogued most days.</span>
        </div>
      </div>
    </div>
  );
}
