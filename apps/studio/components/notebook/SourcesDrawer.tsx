"use client";

import { useEffect, useState } from "react";

/* What a notebook can draw on, in two categories:
 *  - Platforms: whole connected accounts/channels (Drive, YouTube), tagged
 *    `conn:<id>` on the block's sources.
 *  - Clusters: semantic topic clusters from consolidation, tagged `topic:<id>`.
 * Both are just prefixed tags in the same `sources` array — the split here is
 * presentational, so you can reason about "where it comes from" separately
 * from "which slice of it". */
export type SourceCategory = "platforms" | "clusters";

export const SOURCE_CATEGORIES: { id: SourceCategory; label: string; hint: string }[] = [
  { id: "platforms", label: "Platforms", hint: "Connected accounts and channels feeding this notebook" },
  { id: "clusters", label: "Clusters", hint: "Semantic topic clusters from your indexed knowledge" },
];

export interface ClusterOption {
  topic_id: string;
  label: string;
  doc_count: number;
  parent_topic_id: string | null;
}

interface Connection {
  id: string;
  label: string;
  kind: "drive" | "youtube";
  docCount?: number;
}

interface SourcesDrawerProps {
  category: SourceCategory;
  onCategoryChange: (category: SourceCategory) => void;
  onClose: () => void;
  /** Prefixed tags currently on the notebook (`conn:…` / `topic:…`). */
  selectedSources: string[];
  /** Receives the prefixed tag to toggle. */
  onToggleSource: (tag: string) => void;
  clusters: ClusterOption[];
}

const KIND_LABEL: Record<Connection["kind"], string> = {
  drive: "Google Drive",
  youtube: "YouTube",
};

export function SourcesDrawer({
  category,
  onCategoryChange,
  onClose,
  selectedSources,
  onToggleSource,
  clusters,
}: SourcesDrawerProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/drive/status").then((r) => (r.ok ? r.json() : { connections: [] })),
      fetch("/api/youtube/status").then((r) => (r.ok ? r.json() : { connections: [] })),
    ])
      .then(([drive, youtube]) => {
        if (cancelled) return;
        const driveConns: Connection[] = (drive.connections ?? []).map((c: any) => ({
          id: c.id,
          label: c.google_account_email,
          docCount: c.doc_count,
          kind: "drive" as const,
        }));
        const ytConns: Connection[] = (youtube.connections ?? []).map((c: any) => ({
          id: c.id,
          label: c.channel_name ?? c.channel_id,
          kind: "youtube" as const,
        }));
        setConnections([...driveConns, ...ytConns]);
      })
      .catch(() => !cancelled && setError("Couldn't load connections."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Only root clusters — children are implicit, same rule the old picker used.
  const rootClusters = clusters.filter((c) => !c.parent_topic_id);
  const activeHint = SOURCE_CATEGORIES.find((c) => c.id === category)?.hint;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(38,41,34,0.28)", zIndex: 20 }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "440px",
          background: "#FAF8F0",
          borderLeft: "1px solid #E4DECC",
          zIndex: 21,
          padding: "26px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.08)",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div
            style={{
              fontFamily: "var(--font-source-serif), serif",
              fontWeight: 600,
              fontSize: "20px",
              color: "#262922",
            }}
          >
            Sources
          </div>
          <div onClick={onClose} style={{ cursor: "pointer", color: "#8A9488", fontSize: "18px" }}>
            ✕
          </div>
        </div>

        <div style={{ display: "flex", gap: "5px" }}>
          {SOURCE_CATEGORIES.map((c) => {
            const active = c.id === category;
            return (
              <div
                key={c.id}
                onClick={() => onCategoryChange(c.id)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  padding: "6px 8px",
                  borderRadius: "999px",
                  border: `1px solid ${active ? "#3C4A3A" : "#E4DECC"}`,
                  background: active ? "#3C4A3A" : "#FFFDF9",
                  color: active ? "#FAF8F0" : "#55594D",
                  fontSize: "11.5px",
                  fontWeight: 600,
                }}
              >
                {c.label}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: "11.5px", color: "#8A9488", marginTop: "-8px" }}>{activeHint}</div>

        {category === "platforms" && (
          <>
            {loading && <Muted>Loading connections…</Muted>}
            {error && <Muted tone="error">{error}</Muted>}
            {!loading && !error && connections.length === 0 && (
              <Muted>
                No platforms connected yet. Connect Google Drive or YouTube from Integrations, then
                they&apos;ll show up here.
              </Muted>
            )}
            {connections.map((conn) => {
              const tag = `conn:${conn.id}`;
              return (
                <SourceRow
                  key={conn.id}
                  title={conn.label}
                  meta={[KIND_LABEL[conn.kind], conn.docCount != null ? `${conn.docCount} docs` : ""]
                    .filter(Boolean)
                    .join(" · ")}
                  selected={selectedSources.includes(tag)}
                  onClick={() => onToggleSource(tag)}
                />
              );
            })}
          </>
        )}

        {category === "clusters" && (
          <>
            {rootClusters.length === 0 && (
              <Muted>
                No clusters yet. They appear once your documents have been consolidated.
              </Muted>
            )}
            {rootClusters.map((c) => {
              const tag = `topic:${c.topic_id}`;
              return (
                <SourceRow
                  key={c.topic_id}
                  title={c.label}
                  meta={`${c.doc_count} doc${c.doc_count === 1 ? "" : "s"}`}
                  selected={selectedSources.includes(tag)}
                  onClick={() => onToggleSource(tag)}
                />
              );
            })}
          </>
        )}
      </div>
    </>
  );
}

function Muted({ children, tone }: { children: React.ReactNode; tone?: "error" }) {
  return (
    <div style={{ fontSize: "12.5px", color: tone === "error" ? "#7E3A33" : "#8A9488", lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

function SourceRow({
  title,
  meta,
  selected,
  onClick,
}: {
  title: string;
  meta: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "11px",
        background: selected ? "#F1EEE2" : "#FFFDF9",
        border: `1px solid ${selected ? "#3C4A3A" : "#E4DECC"}`,
        borderRadius: "12px",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "5px",
          flexShrink: 0,
          border: `1px solid ${selected ? "#3C4A3A" : "#D9D2BE"}`,
          background: selected ? "#3C4A3A" : "transparent",
          color: "#FAF8F0",
          fontSize: "12px",
          lineHeight: "16px",
          textAlign: "center",
        }}
      >
        {selected ? "✓" : ""}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: "13.5px",
            fontWeight: 600,
            color: "#262922",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        {meta && <div style={{ fontSize: "11.5px", color: "#8A9488", marginTop: "2px" }}>{meta}</div>}
      </div>
    </div>
  );
}
