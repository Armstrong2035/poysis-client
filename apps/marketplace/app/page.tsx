import { getAllCreators, getFeatured, getTrending, getLatest, getDomains } from "@/lib/creators";
import { FeaturedCard, TrendingCard, LatestRow, DomainLink } from "@/components/marketplace/NotebookCards";

export default async function HomePage() {
  const creators = await getAllCreators();
  const featured = getFeatured(creators);
  const trending = getTrending(creators, featured?.slug);
  const latest = getLatest(creators);
  const domains = getDomains(creators);

  return (
    <div style={{ flex: 1 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 18px 90px" }}>
        <div style={{ marginBottom: 26 }}>
          <div
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontWeight: 600,
              fontSize: "clamp(22px,5.4vw,30px)",
              lineHeight: 1.14,
              letterSpacing: "-0.6px",
              color: "#262922",
              marginBottom: 6,
            }}
          >
            Talk to the people worth learning from.
          </div>
          <p style={{ fontSize: 14.5, color: "#55594D", lineHeight: 1.5, margin: 0 }}>
            Every notebook is a creator whose channel we&rsquo;ve indexed in full — ask a question, get their answer, cited to the video.
          </p>
        </div>

        {creators.length === 0 && (
          <div
            style={{
              border: "2px dashed #E4DECC",
              borderRadius: 22,
              padding: "48px 20px",
              textAlign: "center",
              color: "#55594D",
            }}
          >
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, color: "#262922", marginBottom: 8 }}>
              No one indexed yet.
            </div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>A new notebook drops most days — check back soon.</div>
          </div>
        )}

        {featured && (
          <div style={{ marginBottom: 34 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 13 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7E3A33", display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1.4px", color: "#7E3A33", textTransform: "uppercase" }}>
                Just Dropped
              </span>
            </div>
            <FeaturedCard creator={featured} />
          </div>
        )}

        {trending.length > 0 && (
          <div style={{ marginBottom: 30 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1.4px", color: "#84977A", textTransform: "uppercase", marginBottom: 13 }}>
              Trending
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", margin: "0 -18px", padding: "0 18px 4px" }}>
              {trending.map((c) => (
                <TrendingCard key={c.slug} creator={c} />
              ))}
            </div>
          </div>
        )}

        {latest.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1.4px", color: "#84977A", textTransform: "uppercase", marginBottom: 13 }}>
              Latest
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {latest.map((c) => (
                <LatestRow key={c.slug} creator={c} />
              ))}
            </div>
          </div>
        )}

        {domains.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1.4px", color: "#84977A", textTransform: "uppercase", marginBottom: 13 }}>
              Browse by domain
            </div>
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
