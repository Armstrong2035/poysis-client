"use client";

import type { ConsolidationProgress } from "@/app/hooks/useConsolidationProgress";

/**
 * Fixed bottom pane that reflects live consolidation progress. Appears when a
 * snapshot starts (channel connect / sync / build map) and streams counters
 * until the run finishes, fails, or is dismissed.
 */
export function ConsolidationProgressPane({
  progress,
  onDismiss,
}: {
  progress: ConsolidationProgress;
  onDismiss: () => void;
}) {
  const { phase } = progress;
  const isError = phase === "failed" || phase === "not_started";
  const isDone = phase === "done";
  const isWorking = phase === "running" || phase === "clustering";

  const heading = isError
    ? "Couldn't build your notebook"
    : isDone
      ? "Your notebook is ready"
      : phase === "clustering"
        ? "Organizing topics…"
        : "Indexing your sources…";

  const sub = isError
    ? (progress.error ?? "Something went wrong.")
    : isDone
      ? [
          progress.totalTopics != null ? `${progress.totalTopics} topics` : "",
          progress.vectorsIndexed != null ? `${progress.vectorsIndexed} passages` : "",
        ]
          .filter(Boolean)
          .join(" · ") || "Everything's indexed and grounded."
      : phase === "clustering"
        ? "Indexing done — building the topic map."
        : "This runs in the background — you can keep working.";

  const accent = isError ? "#B9422F" : isDone ? "#3C4A3A" : "#C99A5C";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "18px",
        transform: "translateX(-50%)",
        width: "min(680px, calc(100vw - 32px))",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        background: "#FBF9F3",
        border: "1px solid rgba(35,38,31,.12)",
        borderRadius: "14px",
        boxShadow: "0 20px 48px -16px rgba(35,38,31,.4)",
        padding: "14px 16px",
        zIndex: 70,
        animation: "pz-pop .22s ease",
      }}
    >
      {/* Status glyph */}
      <div
        style={{
          width: "34px",
          height: "34px",
          flex: "0 0 auto",
          borderRadius: "9px",
          background: isError ? "rgba(185,66,47,.12)" : isDone ? "#EBF0E5" : "rgba(201,154,92,.15)",
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
        }}
      >
        {isError ? (
          "!"
        ) : isDone ? (
          "✓"
        ) : (
          <span
            style={{
              display: "inline-block",
              width: "15px",
              height: "15px",
              border: "2px solid rgba(201,154,92,.35)",
              borderTopColor: accent,
              borderRadius: "999px",
              animation: "pz-spin .8s linear infinite",
            }}
          />
        )}
      </div>

      {/* Text */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#23261F" }}>{heading}</div>
        <div style={{ fontSize: "12.5px", color: isError ? "#B9422F" : "#6B6D62", marginTop: "1px" }}>
          {sub}
        </div>
      </div>

      {/* Live counters while indexing */}
      {isWorking && (
        <div style={{ display: "flex", gap: "16px", flex: "0 0 auto" }}>
          <Counter label="Indexed" value={progress.docsProcessed} />
          <Counter label="Passages" value={progress.vectorsIndexed} />
        </div>
      )}

      {/* Dismiss — always available; the run continues server-side if working. */}
      <button
        onClick={onDismiss}
        title={isWorking ? "Hide — indexing continues in the background" : "Dismiss"}
        style={{
          flex: "0 0 auto",
          fontSize: "16px",
          color: "#B7B9AD",
          padding: "0 2px",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

function Counter({ label, value }: { label: string; value?: number }) {
  return (
    <div style={{ textAlign: "right", minWidth: "48px" }}>
      <div style={{ fontSize: "15px", fontWeight: 700, color: "#23261F", fontVariantNumeric: "tabular-nums" }}>
        {value ?? 0}
      </div>
      <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "#9A9C90" }}>
        {label}
      </div>
    </div>
  );
}
