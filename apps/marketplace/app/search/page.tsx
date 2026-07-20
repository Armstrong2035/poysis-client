import Link from "next/link";
import { getAllCreators, searchCreators, filterByDomain } from "@/lib/creators";
import { ResultRow } from "@/components/marketplace/NotebookCards";
import { RequestCreatorButton } from "@/components/marketplace/RequestCreatorButton";

interface Props {
  searchParams: Promise<{ q?: string; domain?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, domain } = await searchParams;
  const creators = await getAllCreators();

  const filtered = domain ? filterByDomain(creators, domain) : q ? searchCreators(creators, q) : creators;
  const heading = domain ?? (q ? `Results for “${q}”` : "Everyone");

  return (
    <div style={{ flex: 1 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 18px 90px" }}>
        <Link
          href="/"
          className="mkt-mono"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--muted)",
            fontSize: 10,
            padding: "0 0 18px",
            textDecoration: "none",
            width: "fit-content",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Home
        </Link>
        <h2 className="mkt-serif" style={{ fontWeight: 600, fontSize: "clamp(21px,4vw,27px)", color: "var(--ink)", margin: "0 0 5px", letterSpacing: "-0.01em" }}>
          {heading}
        </h2>
        <p className="mkt-mono" style={{ fontSize: 10.5, color: "var(--faint)", margin: "0 0 22px" }}>
          {filtered.length} {filtered.length === 1 ? "mind" : "minds"} to learn from
        </p>

        {filtered.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map((c) => (
              <ResultRow key={c.slug} creator={c} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--muted)" }}>
            <div className="mkt-serif" style={{ fontSize: 18, color: "var(--ink)", marginBottom: 8 }}>
              No one indexed yet{q ? ` for “${q}”` : ""}.
            </div>
            <div style={{ fontSize: 14, marginBottom: 18 }}>Tell us who to add — we index new channels most days.</div>
            <RequestCreatorButton />
          </div>
        )}
      </div>
    </div>
  );
}
