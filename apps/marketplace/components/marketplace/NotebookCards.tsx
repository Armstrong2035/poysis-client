import Link from "next/link";
import { Avatar } from "./Avatar";
import type { ResolvedCreator, DomainCard } from "@/lib/creators";

function subtitleOf(creator: ResolvedCreator): string {
  return [creator.creator, creator.sourceCount ? `${creator.sourceCount} videos indexed` : ""].filter(Boolean).join(" · ");
}

function TalkCTA() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#3C4A3A", flexShrink: 0 }}>
      Talk
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#84977A" strokeWidth="2.6">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </div>
  );
}

// Elevated "Just Dropped" hero — dark, with a warm radial glow. The header and
// each suggested question are their own links (a question deep-links straight
// into the chat via ?q=), so the card is a plain container rather than one big
// anchor (no nested <a>).
export function FeaturedCard({ creator }: { creator: ResolvedCreator }) {
  const subtitle = subtitleOf(creator);
  return (
    <div
      className="mkt-lift"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#262922",
        borderRadius: 26,
        padding: 26,
        boxShadow: "0 2px 4px rgba(38,41,34,0.08), 0 20px 44px -20px rgba(38,41,34,0.5)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -70,
          right: -50,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,138,93,0.28), transparent 68%)",
          pointerEvents: "none",
        }}
      />
      <Link href={`/${creator.slug}`} style={{ display: "block", textDecoration: "none", color: "inherit", position: "relative" }}>
        <div style={{ display: "flex", gap: 17, alignItems: "center", marginBottom: 18 }}>
          <Avatar initial={creator.initial} color={creator.color} size={68} fontSize={28} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 23, color: "#FAF8F0", lineHeight: 1.12, letterSpacing: "-0.3px" }}>
              {creator.title}
            </div>
            {subtitle && <div style={{ fontSize: 13, color: "#C98A5D", fontWeight: 600, marginTop: 3 }}>{subtitle}</div>}
          </div>
        </div>
        <p style={{ fontSize: 14.5, color: "#CBD3C2", lineHeight: 1.55, margin: "0 0 18px" }}>{creator.tagline}</p>
      </Link>
      {creator.questions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
          {creator.questions.slice(0, 2).map((q) => (
            <Link
              key={q}
              href={`/${creator.slug}?q=${encodeURIComponent(q)}`}
              style={{
                background: "rgba(250,248,240,0.06)",
                border: "1px solid rgba(250,248,240,0.14)",
                borderRadius: 13,
                padding: "13px 15px",
                fontSize: 14,
                color: "#FAF8F0",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span>{q}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C98A5D" strokeWidth="2.4" style={{ flexShrink: 0 }}>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function TrendingCard({ creator }: { creator: ResolvedCreator }) {
  return (
    <Link
      href={`/${creator.slug}`}
      className="mkt-lift"
      style={{
        background: "#FFFDF9",
        border: "1px solid #EFE9D8",
        borderRadius: 20,
        padding: 19,
        minWidth: 216,
        maxWidth: 216,
        flexShrink: 0,
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 2px rgba(38,41,34,0.04), 0 10px 26px -16px rgba(38,41,34,0.24)",
      }}
    >
      <div style={{ marginBottom: 13 }}>
        <Avatar initial={creator.initial} color={creator.color} size={50} fontSize={20} />
      </div>
      <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 16.5, color: "#262922", lineHeight: 1.18, marginBottom: 3 }}>
        {creator.title}
      </div>
      {creator.creator && <div style={{ fontSize: 12, color: "#7E3A33", fontWeight: 600, marginBottom: 10 }}>{creator.creator}</div>}
      <div style={{ fontSize: 12.5, color: "#55594D", lineHeight: 1.45, marginBottom: 15, flex: 1 }}>{creator.tagline}</div>
      <TalkCTA />
    </Link>
  );
}

export function LatestRow({ creator }: { creator: ResolvedCreator }) {
  return (
    <Link
      href={`/${creator.slug}`}
      className="mkt-lift"
      style={{
        background: "#FFFDF9",
        border: "1px solid #EFE9D8",
        borderRadius: 17,
        padding: "15px 17px",
        display: "flex",
        gap: 14,
        alignItems: "center",
        textDecoration: "none",
        color: "inherit",
        boxShadow: "0 1px 2px rgba(38,41,34,0.04), 0 8px 22px -16px rgba(38,41,34,0.22)",
      }}
    >
      <Avatar initial={creator.initial} color={creator.color} size={48} fontSize={19} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 16.5, color: "#262922", lineHeight: 1.2 }}>
          {creator.title}
        </div>
        <div style={{ fontSize: 13, color: "#55594D", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {creator.tagline}
        </div>
      </div>
      <TalkCTA />
    </Link>
  );
}

export function ResultRow({ creator }: { creator: ResolvedCreator }) {
  return (
    <Link
      href={`/${creator.slug}`}
      style={{
        background: "#FAF8F0",
        border: "1px solid #E4DECC",
        borderRadius: 16,
        padding: 16,
        cursor: "pointer",
        display: "flex",
        gap: 13,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <Avatar initial={creator.initial} color={creator.color} size={50} fontSize={20} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 16.5, color: "#262922" }}>{creator.title}</div>
        {creator.creator && <div style={{ fontSize: 12.5, color: "#7E3A33", fontWeight: 600, marginBottom: 6 }}>{creator.creator}</div>}
        <div style={{ fontSize: 13.5, color: "#55594D", lineHeight: 1.45, marginBottom: 9 }}>{creator.tagline}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {creator.topics.slice(0, 2).map((t) => (
            <span key={t} style={{ fontSize: 11, fontWeight: 600, color: "#3C4A3A", background: "#EAE7D8", borderRadius: 999, padding: "3px 9px" }}>
              {t}
            </span>
          ))}
          {creator.sourceCount != null && (
            <span style={{ fontSize: 11.5, color: "#8A8C7E", marginLeft: "auto" }}>{creator.sourceCount} videos indexed</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function RelatedCard({ creator }: { creator: ResolvedCreator }) {
  return (
    <Link
      href={`/${creator.slug}`}
      style={{
        background: "#FAF8F0",
        border: "1px solid #E4DECC",
        borderRadius: 14,
        padding: "14px 16px",
        minWidth: 170,
        cursor: "pointer",
        flexShrink: 0,
        textDecoration: "none",
        color: "inherit",
        display: "block",
      }}
    >
      <div style={{ marginBottom: 9 }}>
        <Avatar initial={creator.initial} color={creator.color} size={36} fontSize={15} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#262922", marginBottom: 2 }}>{creator.title}</div>
      <div style={{ fontSize: 12, color: "#7E3A33" }}>{creator.domain}</div>
    </Link>
  );
}

const DOMAIN_PALETTE: Record<DomainCard["color"], [string, string]> = {
  olive: ["#3C4A3A", "#F1EEE2"],
  oxblood: ["#7E3A33", "#F1EEE2"],
  sage: ["#84977A", "#262922"],
  clay: ["#C98A5D", "#262922"],
  stone: ["#55594D", "#F1EEE2"],
  ink: ["#262922", "#F1EEE2"],
};

export function DomainLink({ domain, href }: { domain: DomainCard; href: string }) {
  const pal = DOMAIN_PALETTE[domain.color];
  return (
    <Link
      href={href}
      style={{
        fontFamily: "'Albert Sans', sans-serif",
        fontSize: 14,
        fontWeight: 600,
        color: pal[1],
        background: pal[0],
        border: "none",
        borderRadius: 999,
        padding: "10px 18px",
        cursor: "pointer",
        textDecoration: "none",
        display: "inline-block",
      }}
    >
      {domain.name} <span style={{ opacity: 0.7, fontWeight: 500 }}>{domain.count}</span>
    </Link>
  );
}
