import Link from "next/link";
import { Avatar } from "./Avatar";
import type { ResolvedCreator, DomainCard } from "@/lib/creators";

function Arrow({ size = 14, stroke = 2.4 }: { size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} style={{ flexShrink: 0 }}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function TalkCTA() {
  return (
    <span className="mkt-mono" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink)", flexShrink: 0, fontSize: 10 }}>
      Talk
      <span style={{ color: "var(--accent)" }}>
        <Arrow size={12} stroke={2.6} />
      </span>
    </span>
  );
}

function Lock({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// "Coming soon" affordance shown where a live card would put its CTA.
function ComingSoonTag() {
  return (
    <span className="mkt-mono" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--faint)", flexShrink: 0, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase" }}>
      <Lock size={11} />
      Coming soon
    </span>
  );
}

// Elevated "Just Dropped" entry — the one inversion on the page. On the light
// ground it's an ink card; on a dark ground it flips to warm paper (see the
// --invert-* tokens). The header and each suggested question are their own
// links (a question deep-links straight into the chat via ?q=), so the card is
// a plain container rather than one big anchor (no nested <a>).
export function FeaturedCard({ creator, startHere = false }: { creator: ResolvedCreator; startHere?: boolean }) {
  return (
    <div className="mkt-featured">
      {startHere && (
        <span
          className="mkt-mono"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            borderRadius: 999,
            background: "var(--accent)",
            color: "var(--ground)",
            fontSize: 9.5,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Start here
          <Arrow size={11} stroke={2.8} />
        </span>
      )}
      <div style={{ position: "relative", display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
        <Link href={`/${creator.slug}`} style={{ display: "flex", gap: 16, alignItems: "center", textDecoration: "none", color: "inherit", minWidth: 0 }}>
          <Avatar initial={creator.initial} color={creator.color} size={64} fontSize={27} />
          <div style={{ minWidth: 0 }}>
            <div className="mkt-serif" style={{ fontWeight: 600, fontSize: 24, lineHeight: 1.1, letterSpacing: "-0.01em", color: "var(--invert-ink)" }}>
              {creator.title}
            </div>
            <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {creator.sourceCount != null && (
                <span className="mkt-mono" style={{ fontSize: 10.5, color: "var(--accent)" }}>№ {creator.sourceCount}</span>
              )}
              {creator.sourceCount != null && creator.creator && (
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--invert-mut)" }} />
              )}
              {creator.creator && <span style={{ fontSize: 12.5, color: "var(--invert-mut)" }}>{creator.creator}</span>}
            </div>
          </div>
        </Link>
      </div>
      <p style={{ position: "relative", fontSize: 14.5, lineHeight: 1.55, color: "var(--invert-mut)", margin: "0 0 18px" }}>{creator.tagline}</p>
      {creator.questions.length > 0 && (
        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          {creator.questions.slice(0, 2).map((q, i) => (
            <Link key={q} href={`/${creator.slug}?q=${encodeURIComponent(q)}`} className="mkt-ask">
              <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span className="mkt-mono" style={{ fontSize: 10, color: "var(--accent)", flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                <span>{q}</span>
              </span>
              <Arrow />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function TrendingCard({ creator }: { creator: ResolvedCreator }) {
  if (creator.comingSoon) {
    // Locked placeholder — same shape as a live spine but not a link, so it
    // reads as "populated" without hover-lift or a dead-end click.
    return (
      <div className="mkt-spine" style={{ cursor: "default", opacity: 0.7, pointerEvents: "none" }} aria-disabled="true">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <Avatar initial={creator.initial} color={creator.color} size={44} fontSize={18} />
          <span style={{ color: "var(--faint)" }}><Lock size={14} /></span>
        </div>
        <div className="mkt-serif" style={{ fontWeight: 600, fontSize: 17, lineHeight: 1.15, color: "var(--ink)" }}>
          {creator.title}
        </div>
        {creator.creator && (
          <div className="mkt-mono" style={{ fontSize: 9.5, color: "var(--faint)", margin: "5px 0 9px" }}>{creator.creator}</div>
        )}
        <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--muted)", flex: 1, marginBottom: 14 }}>{creator.tagline}</div>
        <ComingSoonTag />
      </div>
    );
  }
  return (
    <Link href={`/${creator.slug}`} className="mkt-spine">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Avatar initial={creator.initial} color={creator.color} size={44} fontSize={18} />
        {creator.sourceCount != null && (
          <span className="mkt-mono" style={{ fontSize: 10, color: "var(--muted)" }}>№ {creator.sourceCount}</span>
        )}
      </div>
      <div className="mkt-serif" style={{ fontWeight: 600, fontSize: 17, lineHeight: 1.15, color: "var(--ink)" }}>
        {creator.title}
      </div>
      {creator.creator && (
        <div className="mkt-mono" style={{ fontSize: 9.5, color: "var(--accent)", margin: "5px 0 9px" }}>{creator.creator}</div>
      )}
      <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--muted)", flex: 1, marginBottom: 14 }}>{creator.tagline}</div>
      <TalkCTA />
    </Link>
  );
}

export function LatestRow({ creator }: { creator: ResolvedCreator }) {
  if (creator.comingSoon) {
    return (
      <div className="mkt-entry" style={{ cursor: "default", pointerEvents: "none" }} aria-disabled="true">
        <div style={{ opacity: 0.65 }}>
          <Avatar initial={creator.initial} color={creator.color} size={46} fontSize={18} />
        </div>
        <div style={{ minWidth: 0, flex: 1, opacity: 0.7 }}>
          <div className="mkt-serif" style={{ fontWeight: 600, fontSize: 17, lineHeight: 1.2, color: "var(--ink)" }}>
            {creator.title}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {creator.tagline}
          </div>
        </div>
        <span className="mkt-mono" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--faint)", flexShrink: 0, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase" }}>
          <Lock size={12} />
          Soon
        </span>
      </div>
    );
  }
  return (
    <Link href={`/${creator.slug}`} className="mkt-entry">
      <Avatar initial={creator.initial} color={creator.color} size={46} fontSize={18} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="mkt-serif" style={{ fontWeight: 600, fontSize: 17, lineHeight: 1.2, color: "var(--ink)" }}>
          {creator.title}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {creator.tagline}
        </div>
      </div>
      {creator.sourceCount != null && (
        <div className="mkt-mono" style={{ fontSize: 10, color: "var(--faint)", textAlign: "right", flexShrink: 0, letterSpacing: ".08em" }}>
          sources
          <b style={{ display: "block", color: "var(--accent)", fontWeight: 400, fontSize: 13 }}>{creator.sourceCount}</b>
        </div>
      )}
    </Link>
  );
}

export function ResultRow({ creator }: { creator: ResolvedCreator }) {
  if (creator.comingSoon) {
    return (
      <div className="mkt-entry" style={{ alignItems: "flex-start", cursor: "default", pointerEvents: "none" }} aria-disabled="true">
        <div style={{ opacity: 0.65 }}>
          <Avatar initial={creator.initial} color={creator.color} size={48} fontSize={19} />
        </div>
        <div style={{ minWidth: 0, flex: 1, opacity: 0.72 }}>
          <div className="mkt-serif" style={{ fontWeight: 600, fontSize: 17, color: "var(--ink)", lineHeight: 1.2 }}>{creator.title}</div>
          {creator.creator && <div className="mkt-mono" style={{ fontSize: 9.5, color: "var(--faint)", margin: "5px 0 7px" }}>{creator.creator}</div>}
          <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.45, marginBottom: 10 }}>{creator.tagline}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {creator.topics.slice(0, 2).map((t) => (
              <span key={t} className="mkt-mono" style={{ fontSize: 9.5, color: "var(--muted)", border: "1px solid var(--rule)", borderRadius: 2, padding: "3px 8px" }}>
                {t}
              </span>
            ))}
            <span className="mkt-mono" style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--faint)", marginLeft: "auto", fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase" }}>
              <Lock size={11} />
              Coming soon
            </span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <Link href={`/${creator.slug}`} className="mkt-entry" style={{ alignItems: "flex-start" }}>
      <Avatar initial={creator.initial} color={creator.color} size={48} fontSize={19} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="mkt-serif" style={{ fontWeight: 600, fontSize: 17, color: "var(--ink)", lineHeight: 1.2 }}>{creator.title}</div>
        {creator.creator && <div className="mkt-mono" style={{ fontSize: 9.5, color: "var(--accent)", margin: "5px 0 7px" }}>{creator.creator}</div>}
        <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.45, marginBottom: 10 }}>{creator.tagline}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {creator.topics.slice(0, 2).map((t) => (
            <span key={t} className="mkt-mono" style={{ fontSize: 9.5, color: "var(--muted)", border: "1px solid var(--rule)", borderRadius: 2, padding: "3px 8px" }}>
              {t}
            </span>
          ))}
          {creator.sourceCount != null && (
            <span className="mkt-mono" style={{ fontSize: 10, color: "var(--faint)", marginLeft: "auto" }}>№ {creator.sourceCount}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function RelatedCard({ creator }: { creator: ResolvedCreator }) {
  return (
    <Link href={`/${creator.slug}`} className="mkt-surface mkt-lift" style={{ borderRadius: 5, padding: "14px 16px", minWidth: 170, flexShrink: 0, textDecoration: "none", color: "inherit", display: "block" }}>
      <div style={{ marginBottom: 10 }}>
        <Avatar initial={creator.initial} color={creator.color} size={38} fontSize={16} />
      </div>
      <div className="mkt-serif" style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 3, lineHeight: 1.2 }}>{creator.title}</div>
      <div className="mkt-mono" style={{ fontSize: 9.5, color: "var(--accent)" }}>{creator.domain}</div>
    </Link>
  );
}

// Domains render as a ruled index cluster (name — hairline — count), not the
// coloured pill buttons of the old design. `color` is no longer used for a fill
// but kept on the type for callers/back-compat.
export function DomainLink({ domain, href }: { domain: DomainCard; href: string }) {
  return (
    <Link href={href} className="mkt-domain">
      <span className="nm mkt-serif" style={{ fontSize: 15, color: "var(--ink)" }}>{domain.name}</span>
      <span className="ln" />
      <span className="ct mkt-mono" style={{ fontSize: 11, color: "var(--faint)" }}>{String(domain.count).padStart(2, "0")}</span>
    </Link>
  );
}
