import Link from "next/link";
import { Avatar } from "./Avatar";
import type { ResolvedCreator, DomainCard } from "@/lib/creators";

function subtitleOf(creator: ResolvedCreator): string {
  return [creator.creator, creator.sourceCount ? `${creator.sourceCount} videos indexed` : ""].filter(Boolean).join(" · ");
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#84977A" strokeWidth="2.4" style={{ flexShrink: 0 }}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function FeaturedCard({ creator }: { creator: ResolvedCreator }) {
  return (
    <Link
      href={`/${creator.slug}`}
      style={{
        display: "block",
        background: "#FAF8F0",
        border: "1px solid #E4DECC",
        borderRadius: 22,
        padding: 22,
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
        <Avatar initial={creator.initial} color={creator.color} size={64} fontSize={26} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 21, color: "#262922", lineHeight: 1.15 }}>
            {creator.title}
          </div>
          {subtitleOf(creator) && (
            <div style={{ fontSize: 13, color: "#7E3A33", fontWeight: 600, marginTop: 2 }}>{subtitleOf(creator)}</div>
          )}
        </div>
      </div>
      <p style={{ fontSize: 14.5, color: "#55594D", lineHeight: 1.5, margin: "0 0 16px" }}>{creator.tagline}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {creator.questions.slice(0, 2).map((q) => (
          <div
            key={q}
            style={{
              background: "#F1EEE2",
              border: "1px solid #E4DECC",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 14,
              color: "#262922",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <span>{q}</span>
            <ArrowIcon />
          </div>
        ))}
      </div>
    </Link>
  );
}

export function TrendingCard({ creator }: { creator: ResolvedCreator }) {
  return (
    <Link
      href={`/${creator.slug}`}
      style={{
        background: "#FAF8F0",
        border: "1px solid #E4DECC",
        borderRadius: 18,
        padding: 18,
        minWidth: 210,
        maxWidth: 210,
        cursor: "pointer",
        flexShrink: 0,
        textDecoration: "none",
        color: "inherit",
        display: "block",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <Avatar initial={creator.initial} color={creator.color} size={48} fontSize={19} />
      </div>
      <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 16, color: "#262922", lineHeight: 1.2, marginBottom: 3 }}>
        {creator.title}
      </div>
      {creator.creator && <div style={{ fontSize: 12, color: "#7E3A33", fontWeight: 600, marginBottom: 9 }}>{creator.creator}</div>}
      <div style={{ fontSize: 12.5, color: "#55594D", lineHeight: 1.4 }}>{creator.tagline}</div>
    </Link>
  );
}

export function LatestRow({ creator }: { creator: ResolvedCreator }) {
  return (
    <Link
      href={`/${creator.slug}`}
      style={{
        background: "#FAF8F0",
        border: "1px solid #E4DECC",
        borderRadius: 16,
        padding: "15px 16px",
        cursor: "pointer",
        display: "flex",
        gap: 13,
        alignItems: "center",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <Avatar initial={creator.initial} color={creator.color} size={46} fontSize={18} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 16, color: "#262922", lineHeight: 1.2 }}>
          {creator.title}
        </div>
        <div style={{ fontSize: 13, color: "#55594D", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {creator.tagline}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#8A8C7E", flexShrink: 0, textAlign: "right" }}>
        {creator.domain}
        <br />
        {creator.sourceCount ? `${creator.sourceCount} videos` : ""}
      </div>
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
