import Link from "next/link";
import { getAllCreators, getFeatured, getTrending, getLatest, getDomains, getTopics } from "@/lib/creators";
import { HomeSearch } from "@/components/marketplace/HomeSearch";
import { FeaturedCard, TrendingCard, LatestRow, DomainLink } from "@/components/marketplace/NotebookCards";

const SECTION_LABEL = {
  fontSize: 12,
  fontWeight: 700 as const,
  letterSpacing: "1.6px",
  color: "#3C4A3A",
  textTransform: "uppercase" as const,
};

export default async function HomePage() {
  const creators = await getAllCreators();
  const featured = getFeatured(creators);
  const trending = getTrending(creators, featured?.slug);
  const latest = getLatest(creators);
  const domains = getDomains(creators);
  const topics = getTopics(creators);

  return (
    <div style={{ flex: 1 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 18px 90px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontWeight: 600,
              fontSize: "clamp(22px,5.4vw,30px)",
              lineHeight: 1.14,
              letterSpacing: "-0.6px",
              color: "#262922",
              marginBottom: 8,
            }}
          >
            Get trusted answers from the world&rsquo;s best thinkers.
          </div>
          <p style={{ fontSize: 14.5, color: "#55594D", lineHeight: 1.5, margin: 0 }}>
            Ask specific questions and trace every answer back to the exact talk, interview, article or book it came from.
          </p>
        </div>

        <HomeSearch />

        {/* Topic quick-filters */}
        {topics.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 34 }}>
            {topics.map((t) => (
              <Link
                key={t}
                href={`/search?q=${encodeURIComponent(t)}`}
                className="mkt-chip"
                style={{
                  fontFamily: "'Albert Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#55594D",
                  background: "transparent",
                  border: "1px solid #E4DECC",
                  borderRadius: 999,
                  padding: "7px 14px",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                }}
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {creators.length === 0 && (
          <div
            style={{
              border: "2px dashed #E4DECC",
              borderRadius: 22,
              padding: "48px 20px",
              textAlign: "center",
              color: "#55594D",
              marginBottom: 34,
            }}
          >
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, color: "#262922", marginBottom: 8 }}>
              No one indexed yet.
            </div>
            <div style={{ fontSize: 14 }}>A new notebook drops most days — check back soon.</div>
          </div>
        )}

        {/* Just Dropped */}
        {featured && (
          <div style={{ marginBottom: 38 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 13 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#C98A5D", display: "inline-block", boxShadow: "0 0 0 4px rgba(201,138,93,0.22)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1.6px", color: "#7E3A33", textTransform: "uppercase" }}>
                Just Dropped
              </span>
              <span style={{ fontSize: 12, color: "#8A8C7E", marginLeft: "auto" }}>Newest notebook</span>
            </div>
            <FeaturedCard creator={featured} />
          </div>
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <div style={{ marginBottom: 34 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 14 }}>
              <div style={SECTION_LABEL}>Trending</div>
              <div style={{ fontSize: 12.5, color: "#8A8C7E" }}>What people are talking to most</div>
            </div>
            <div style={{ display: "flex", gap: 13, overflowX: "auto", margin: "0 -18px", padding: "2px 18px 6px" }}>
              {trending.map((c) => (
                <TrendingCard key={c.slug} creator={c} />
              ))}
            </div>
          </div>
        )}

        {/* Latest */}
        {latest.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 14 }}>
              <div style={SECTION_LABEL}>Latest</div>
              <div style={{ fontSize: 12.5, color: "#8A8C7E" }}>Freshly indexed</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {latest.map((c) => (
                <LatestRow key={c.slug} creator={c} />
              ))}
            </div>
          </div>
        )}

        {/* Domains */}
        {domains.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ ...SECTION_LABEL, marginBottom: 14 }}>Browse by domain</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
              {domains.map((d) => (
                <DomainLink key={d.name} domain={d} href={`/search?domain=${encodeURIComponent(d.name)}`} />
              ))}
            </div>
          </div>
        )}

        <div style={{ borderTop: "1px solid #E4DECC", paddingTop: 22 }}>
          <div style={{ fontSize: 13, color: "#8A8C7E" }}>A new notebook drops most days.</div>
        </div>
      </div>
    </div>
  );
}
