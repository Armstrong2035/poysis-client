"use client";

import { useEffect, useState } from "react";
import type { ConsolidationProgress } from "@/app/hooks/useConsolidationProgress";
import type { NotebookSummary } from "@/app/hooks/useNotebookSummary";

/** Minimised is a lasting preference, not a per-visit one. */
const MINIMIZED_KEY = "pz-notebook-proof-minimized";

/**
 * What the creator has actually built, at the head of the Studio middle pane.
 *
 * This is proof, not status: the figures are the payoff for connecting a
 * channel, so they lead at full size and stay put. A run in flight is a footnote
 * underneath — never the headline, and never a spinner standing where a number
 * should be. Even mid-run the counts shown are videos already *in*, so the
 * number only ever climbs.
 */
export function NotebookProof({
  progress,
  summary,
}: {
  progress: ConsolidationProgress;
  summary?: NotebookSummary;
}) {
  const isWorking = progress.phase === "running" || progress.phase === "clustering";
  const failed = progress.phase === "failed" || progress.phase === "not_started";

  // Settled totals describe the whole notebook; the job's counters only describe
  // the latest run, so they stand in solely until something has settled.
  const videos = summary?.documents ?? progress.docsProcessed ?? null;
  const passages = summary?.passages ?? progress.vectorsIndexed ?? null;
  const categories = summary?.topLevel.length || progress.totalTopics || null;
  const topLevel = summary?.topLevel ?? [];

  const updated = relativeTime(summary?.lastUpdated ?? progress.completedAt ?? null);

  // Start expanded and correct the first paint from storage — reading it during
  // render would disagree with the server-rendered markup.
  const [minimized, setMinimized] = useState(false);
  useEffect(() => {
    try {
      setMinimized(window.localStorage.getItem(MINIMIZED_KEY) === "1");
    } catch {
      // Storage blocked — the panel just opens expanded every time.
    }
  }, []);

  const toggleMinimized = () =>
    setMinimized((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(MINIMIZED_KEY, next ? "1" : "0");
      } catch {
        // Preference is lost on reload; the toggle still works for this view.
      }
      return next;
    });

  /** The same proof as one line, for when it's minimised. */
  const facts = [
    videos != null ? `${videos.toLocaleString()} ${videos === 1 ? "video" : "videos"}` : "",
    passages != null
      ? `${passages.toLocaleString()} ${passages === 1 ? "passage" : "passages"}`
      : "",
    categories != null
      ? `${categories.toLocaleString()} ${categories === 1 ? "category" : "categories"}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const note = failed
    ? (progress.error ?? "Something went wrong on the last run.")
    : [updated && `Updated ${updated}`, isWorking && "still adding"]
        .filter(Boolean)
        .join(" · ");

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        width: "100%",
        background: "#fff",
        border: "1px solid rgba(35,38,31,.12)",
        borderRadius: "14px",
        padding: "16px 20px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#8A8C80",
          }}
        >
          In your notebook
        </div>
        <button
          onClick={toggleMinimized}
          aria-expanded={!minimized}
          title={minimized ? "Expand" : "Minimize"}
          aria-label={minimized ? "Expand notebook summary" : "Minimize notebook summary"}
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            marginRight: "-4px",
            borderRadius: "7px",
            color: "#8A8C80",
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              transform: minimized ? "rotate(180deg)" : "none",
              transition: "transform .18s ease",
            }}
          >
            <polyline points="6 15 12 9 18 15" />
          </svg>
        </button>
      </div>

      {/* Minimised still states what's there — a smaller claim, not a hidden
          one. Collapsing must never leave the creator with nothing. */}
      {minimized ? (
        <div style={{ marginTop: "6px", fontSize: "13px", color: "#23261F" }}>
          {facts}
          {note && <span style={{ color: "#9A9C90" }}>{facts ? " · " : ""}{note}</span>}
        </div>
      ) : (
        <>
          {/* The figures, at a size that reads as an achievement rather than a
              readout. Tabular numerals so a climbing count doesn't jitter. */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "36px", marginTop: "10px" }}>
            <Stat value={videos} label={videos === 1 ? "video" : "videos"} />
            <Stat value={passages} label={passages === 1 ? "passage" : "passages"} />
            <Stat value={categories} label={categories === 1 ? "category" : "categories"} />
          </div>

          {/* Categories in full — what the notebook actually knows about. Open
              by default: hiding them behind a toggle buries the substance. */}
          {topLevel.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "14px" }}>
              {topLevel.map((category) => (
                <span
                  key={category.topicId}
                  title={category.summary}
                  style={{
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: "6px",
                    maxWidth: "100%",
                    background: "#F0EDE3",
                    borderRadius: "999px",
                    padding: "5px 10px",
                    fontSize: "12px",
                    color: "#3A3C33",
                  }}
                >
                  <span
                    style={{
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {category.label}
                  </span>
                  <span
                    style={{ flex: "0 0 auto", color: "#8A8C80", fontVariantNumeric: "tabular-nums" }}
                  >
                    {category.docCount.toLocaleString()}
                  </span>
                </span>
              ))}
            </div>
          )}

          {note && (
            <div
              style={{
                marginTop: "12px",
                fontSize: "11.5px",
                color: failed ? "#B9422F" : "#9A9C90",
              }}
            >
              {note}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number | null; label: string }) {
  if (value == null) return null;
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-source-serif), serif",
          fontSize: "34px",
          fontWeight: 600,
          lineHeight: 1.05,
          letterSpacing: "-.02em",
          color: "#23261F",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: "12px", color: "#6B6D62", marginTop: "3px" }}>{label}</div>
    </div>
  );
}

/** "3m ago", "2h ago", "5d ago" — enough to date the work, no more. */
function relativeTime(iso: string | null) {
  if (!iso) return "";
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
