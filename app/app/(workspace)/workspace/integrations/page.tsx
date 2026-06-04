"use client";

import Link from "next/link";

const COMING_SOON = [
  { id: "openai", name: "OpenAI", icon: "O", description: "GPT-4, embeddings, fine-tuning" },
  { id: "cohere", name: "Cohere", icon: "C", description: "Command, Embed, Rerank" },
  { id: "pinecone", name: "Pinecone", icon: "P", description: "Vector database & search" },
  { id: "zapier", name: "Zapier", icon: "Z", description: "Automate across 6,000+ apps" },
];

export default function IntegrationsPage() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1
          style={{ fontFamily: "Syne, sans-serif", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", color: "#E8E9ED", marginBottom: "6px" }}
        >
          Integrations
        </h1>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", fontWeight: 300, color: "#9CA0AC" }}>
          Connect AI providers and services to power your workspace.
        </p>
      </div>

      {/* Active integrations */}
      <section className="mb-8">
        <SectionLabel text="Active" />
        <div className="space-y-2">
          {/* Claude */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded"
            style={{ background: "rgba(107,176,122,0.06)", border: "1px solid rgba(107,176,122,0.2)" }}
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(107,176,122,0.12)", fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700, color: "#6BB07A" }}
            >
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 400, color: "#E8E9ED" }}>
                  Claude (Anthropic)
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6BB07A]" style={{ boxShadow: "0 0 5px rgba(107,176,122,0.7)" }} />
                  <span
                    style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#6BB07A", textTransform: "uppercase" as const }}
                  >
                    Active
                  </span>
                </div>
              </div>
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#9CA0AC", marginTop: "2px" }}>
                Powers AI blocks in your playgrounds
              </div>
            </div>
            <Link
              href="/query"
              className="px-2.5 py-1 rounded transition-all hover:bg-[rgba(232,165,71,0.12)]"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#E8A547", textTransform: "uppercase" as const, border: "1px solid rgba(232,165,71,0.25)", textDecoration: "none" }}
            >
              Open →
            </Link>
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section>
        <SectionLabel text="Coming Soon" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COMING_SOON.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-3 py-3 rounded"
              style={{ background: "rgba(58,61,71,0.15)", border: "1px solid rgba(58,61,71,0.3)", opacity: 0.55 }}
            >
              <div
                className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(58,61,71,0.5)", fontFamily: "Syne, sans-serif", fontSize: "12px", fontWeight: 700, color: "#9CA0AC" }}
              >
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 400, color: "#9CA0AC" }}>{s.name}</div>
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#3A3D47" }}>{s.description}</div>
              </div>
              <SoonPill />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      className="mb-3"
      style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#9CA0AC", textTransform: "uppercase" as const }}
    >
      {text}
    </div>
  );
}

function SoonPill() {
  return (
    <div
      className="px-1.5 py-0.5 rounded flex-shrink-0"
      style={{ background: "rgba(58,61,71,0.5)", fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.15em", color: "#3A3D47", textTransform: "uppercase" as const }}
    >
      Soon
    </div>
  );
}
