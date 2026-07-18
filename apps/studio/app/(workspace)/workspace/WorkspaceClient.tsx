"use client";

import Link from "next/link";
import { createNotebook, deleteNotebook } from "../../../lib/actions";
import { DeleteNotebookButton } from "../../../components/workspace/DeleteNotebookButton";

type Notebook = {
  id: string;
  name: string;
  updated_at: string;
};

type BotRecommendation = {
  id: string;
  name: string;
  description: string;
  basedOn: string;
  docCount: number;
  category: "chatbot" | "search" | "assistant" | "analyzer";
  confidence: "high" | "medium";
};

const CATEGORY_LABELS: Record<BotRecommendation["category"], string> = {
  chatbot: "Chatbot",
  search: "Search",
  assistant: "Assistant",
  analyzer: "Analyzer",
};

type Props = {
  notebooks: Notebook[];
  recommendations: BotRecommendation[];
};

export function WorkspaceClient({ notebooks, recommendations }: Props) {
  return (
    <div
      className="relative"
      style={{ color: "#E8E9ED", fontFamily: "DM Sans, sans-serif" }}
    >
      <div className="relative max-w-4xl mx-auto px-8 py-10">

        {/* Page title */}
        <div className="mb-10">
          <h1
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#E8E9ED",
              marginBottom: "6px",
            }}
          >
            Playground
          </h1>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              fontWeight: 300,
              color: "#9CA0AC",
            }}
          >
            Build AI assistants from your knowledge clusters.
          </p>
        </div>

        {/* ── OUROBOROS ── */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <OuroborosIcon />
              <span
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: "#E8A547",
                  textTransform: "uppercase",
                }}
              >
                Ouroboros
              </span>
            </div>
            <div style={{ height: "1px", flex: 1, background: "rgba(232,165,71,0.15)" }} />
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "9px",
                letterSpacing: "0.15em",
                color: "#9CA0AC",
                textTransform: "uppercase",
              }}
            >
              {recommendations.length} suggestions
            </span>
          </div>

          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              fontWeight: 300,
              color: "#9CA0AC",
              marginBottom: "16px",
              lineHeight: 1.6,
            }}
          >
            Based on your knowledge clusters, these are the AI assistants your team would benefit from most.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
        </section>

        <div className="mb-10" style={{ borderTop: "1px solid rgba(58,61,71,0.4)" }} />

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-1 gap-4 mb-10">
          <form action={createNotebook} className="h-full">
            <button
              type="submit"
              className="w-full h-full min-h-[140px] rounded-xl p-6 flex flex-col items-start text-left transition-all duration-200 hover:bg-[rgba(232,165,71,0.07)] hover:border-[rgba(232,165,71,0.5)]"
              style={{
                background: "rgba(232,165,71,0.04)",
                border: "1px dashed rgba(232,165,71,0.25)",
                cursor: "pointer",
              }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center mb-4"
                style={{ background: "rgba(232,165,71,0.1)" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#E8A547" strokeWidth="1.5">
                  <line x1="7" y1="2" x2="7" y2="12" />
                  <line x1="2" y1="7" x2="12" y2="7" />
                </svg>
              </div>
              <h3
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#E8E9ED",
                  marginBottom: "4px",
                }}
              >
                Blank canvas
              </h3>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC" }}>
                Build a custom AI pipeline from scratch.
              </p>
            </button>
          </form>

        </div>

        {/* ── Notebooks ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "9px",
                letterSpacing: "0.2em",
                color: "#9CA0AC",
                textTransform: "uppercase",
              }}
            >
              Notebooks{notebooks.length > 0 ? ` · ${notebooks.length}` : ""}
            </span>
            <form action={createNotebook}>
              <button
                type="submit"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.15em",
                  color: "#E8A547",
                  textTransform: "uppercase",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                className="hover:text-[#F5B25F] transition-colors"
              >
                + New
              </button>
            </form>
          </div>

          {notebooks.length === 0 ? (
            <div
              className="py-14 flex items-center justify-center rounded-xl"
              style={{ border: "1px dashed rgba(58,61,71,0.5)" }}
            >
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 300, color: "#3A3D47" }}>
                No notebooks yet — build one from a suggestion above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {notebooks.map((nb) => {
                const deleteWithId = deleteNotebook.bind(null, nb.id);
                return (
                  <div
                    key={nb.id}
                    className="group relative rounded-xl transition-all duration-200 hover:border-[rgba(232,165,71,0.25)]"
                    style={{
                      background: "rgba(58,61,71,0.12)",
                      border: "1px solid rgba(58,61,71,0.35)",
                    }}
                  >
                    <Link href={`/workspace/canvas?notebook=${nb.id}`} className="flex flex-col p-5" style={{ textDecoration: "none" }}>
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ background: "rgba(232,165,71,0.1)" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#E8A547" strokeWidth="1.3">
                            <rect x="1" y="1" width="10" height="10" rx="1.5" />
                            <line x1="3" y1="4" x2="9" y2="4" />
                            <line x1="3" y1="6.5" x2="7" y2="6.5" />
                          </svg>
                        </div>
                        <span
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "8px",
                            letterSpacing: "0.15em",
                            color: "#6BB07A",
                            textTransform: "uppercase",
                            background: "rgba(107,176,122,0.1)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid rgba(107,176,122,0.2)",
                          }}
                        >
                          Live
                        </span>
                      </div>
                      <h3
                        className="truncate mb-1"
                        style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 400, color: "#E8E9ED" }}
                      >
                        {nb.name || "Untitled Notebook"}
                      </h3>
                      <p
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "9px",
                          color: "#3A3D47",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {new Date(nb.updated_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </Link>
                    <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DeleteNotebookButton action={deleteWithId} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: BotRecommendation }) {
  return (
    <div
      className="flex flex-col rounded-xl p-5 transition-all duration-200 hover:border-[rgba(232,165,71,0.35)] hover:bg-[rgba(232,165,71,0.05)]"
      style={{
        background: "rgba(232,165,71,0.03)",
        border: "1px solid rgba(232,165,71,0.15)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "8px",
            letterSpacing: "0.18em",
            color: "#E8A547",
            textTransform: "uppercase",
            background: "rgba(232,165,71,0.1)",
            padding: "2px 7px",
            borderRadius: "4px",
            border: "1px solid rgba(232,165,71,0.2)",
          }}
        >
          {CATEGORY_LABELS[rec.category]}
        </span>
        {rec.confidence === "high" && (
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-[#6BB07A]" style={{ boxShadow: "0 0 4px rgba(107,176,122,0.7)" }} />
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.12em", color: "#6BB07A", textTransform: "uppercase" }}>
              High fit
            </span>
          </div>
        )}
      </div>

      <h3
        style={{
          fontFamily: "Syne, sans-serif",
          fontSize: "14px",
          fontWeight: 700,
          color: "#E8E9ED",
          letterSpacing: "-0.01em",
          marginBottom: "6px",
        }}
      >
        {rec.name}
      </h3>

      <p
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "12px",
          fontWeight: 300,
          color: "#9CA0AC",
          lineHeight: 1.55,
          flex: 1,
          marginBottom: "14px",
        }}
      >
        {rec.description}
      </p>

      <div className="flex items-center gap-1.5 mb-4">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#3A3D47" strokeWidth="1.2">
          <circle cx="5" cy="5" r="3.5" strokeDasharray="2 1.5" />
        </svg>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#3A3D47", letterSpacing: "0.08em" }}>
          {rec.basedOn} · {rec.docCount} docs
        </span>
      </div>

      <form action={createNotebook}>
        <button
          type="submit"
          className="w-full py-2 rounded transition-all duration-200 hover:bg-[rgba(232,165,71,0.15)]"
          style={{
            background: "rgba(232,165,71,0.08)",
            border: "1px solid rgba(232,165,71,0.25)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "#E8A547",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Build this →
        </button>
      </form>
    </div>
  );
}

function OuroborosIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#E8A547" strokeWidth="1.2" strokeDasharray="3 1.5" opacity="0.6" />
      <circle cx="8" cy="8" r="2.5" fill="rgba(232,165,71,0.15)" stroke="#E8A547" strokeWidth="1" />
      <circle cx="8" cy="2.5" r="1" fill="#E8A547" opacity="0.8" />
    </svg>
  );
}
