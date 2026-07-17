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
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#55594D",
            fontFamily: "'Albert Sans', sans-serif",
            fontSize: 13,
            padding: "0 0 16px",
            fontWeight: 500,
            textDecoration: "none",
            width: "fit-content",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#55594D" strokeWidth="2.2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Home
        </Link>
        <h2 style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: "clamp(21px,4vw,27px)", color: "#262922", margin: "0 0 4px" }}>
          {heading}
        </h2>
        <p style={{ fontSize: 13.5, color: "#55594D", margin: "0 0 22px" }}>{filtered.length} people to learn from</p>

        {filtered.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((c) => (
              <ResultRow key={c.slug} creator={c} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#55594D" }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, color: "#262922", marginBottom: 8 }}>
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
