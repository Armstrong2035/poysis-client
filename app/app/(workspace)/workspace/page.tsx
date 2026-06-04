"use client";

import { useEffect, useMemo } from "react";
import { useConsolidation, type Topic } from "./ConsolidationContext";

type Phase = "no-sources" | "has-sources" | "running" | "done" | "failed";

function getPhase(status: string, hasConnections: boolean): Phase {
  if (!hasConnections) return "no-sources";
  if (status === "running" || status === "clustering") return "running";
  if (status === "done") return "done";
  if (status === "failed") return "failed";
  return "has-sources";
}

export default function WorkspaceDashboard() {
  const { status, connections } = useConsolidation();
  const phase = getPhase(status, connections.length > 0);

  return (
    <div className="min-h-full px-8 py-10 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", color: "#E8E9ED", marginBottom: "6px" }}>
          Knowledge
        </h1>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", fontWeight: 300, color: "#9CA0AC" }}>
          Your indexed knowledge base and topic map.
        </p>
      </div>

      <div key={phase} style={{ animation: "fade-in 240ms ease-out both" }}>
        {phase === "no-sources" && <NoSourcesState />}
        {phase === "has-sources" && <HasSourcesState />}
        {phase === "running" && <RunningState />}
        {phase === "done" && <DoneState />}
        {phase === "failed" && <FailedState />}
      </div>
    </div>
  );
}

/* ── No sources ────────────────────────────────────────────────────── */

function NoSourcesState() {
  return (
    <div className="space-y-3">
      <SectionLabel text="Get Started" />

      {/* Connect Google Drive */}
      <button
        onClick={() => { window.location.href = "/api/auth/google-drive"; }}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group"
        style={{ background: "linear-gradient(135deg, rgba(232,165,71,0.08) 0%, rgba(201,149,71,0.04) 100%)", border: "1px solid rgba(232,165,71,0.3)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,165,71,0.55)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,165,71,0.3)"; }}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(232,165,71,0.1)" }}>
          <DriveIcon size={18} />
        </div>
        <div className="flex-1 text-left">
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", fontWeight: 500, color: "#E8E9ED" }}>
            Connect Google Drive
          </div>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC", marginTop: "1px" }}>
            Docs, Sheets, Slides, Folders
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#E8A547" strokeWidth="1.4" className="flex-shrink-0">
          <line x1="2" y1="7" x2="12" y2="7" /><polyline points="8,3 12,7 8,11" />
        </svg>
      </button>

      {/* Step 2 — dimmed until sources connected */}
      <div
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl"
        style={{ background: "rgba(58,61,71,0.08)", border: "1px solid rgba(58,61,71,0.25)", opacity: 0.4, pointerEvents: "none" }}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(58,61,71,0.3)" }}>
          <ClusterIcon size={16} />
        </div>
        <div className="flex-1 text-left">
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", fontWeight: 400, color: "#E8E9ED" }}>
            Build Knowledge Map
          </div>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC", marginTop: "1px" }}>
            Cluster your docs into topics for AI querying
          </div>
        </div>
      </div>

      {/* Coming soon sources */}
      <div className="pt-4">
        <SectionLabel text="Coming Soon" />
        <div className="grid grid-cols-2 gap-2">
          {COMING_SOON.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
              style={{ background: "rgba(58,61,71,0.1)", border: "1px solid rgba(58,61,71,0.2)", opacity: 0.45 }}
            >
              <div
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(58,61,71,0.4)", fontFamily: "Syne, sans-serif", fontSize: "11px", fontWeight: 700, color: "#9CA0AC" }}
              >
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 400, color: "#9CA0AC" }}>{s.name}</div>
              </div>
              <div className="px-1.5 py-0.5 rounded" style={{ background: "rgba(58,61,71,0.5)", fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.15em", color: "#3A3D47", textTransform: "uppercase" as const }}>
                Soon
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Has sources, no map ───────────────────────────────────────────── */

function HasSourcesState() {
  const { connections, openSources, start } = useConsolidation();
  const totalDocs = connections.reduce((sum, c) => sum + (c.doc_count ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Connected sources summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel text="Connected" />
          <button
            onClick={openSources}
            style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#9CA0AC", textTransform: "uppercase" as const }}
            className="hover:text-[#E8A547] transition-colors"
          >
            Manage →
          </button>
        </div>
        <div className="space-y-2">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "rgba(107,176,122,0.05)", border: "1px solid rgba(107,176,122,0.15)" }}
            >
              <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: "rgba(107,176,122,0.1)" }}>
                <DriveIcon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 400, color: "#E8E9ED" }}>
                  {conn.google_account_email}
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#9CA0AC", letterSpacing: "0.08em", marginTop: "1px" }}>
                  {conn.doc_count > 0 ? `${conn.doc_count.toLocaleString()} docs` : "Indexing…"}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6BB07A]" style={{ boxShadow: "0 0 5px rgba(107,176,122,0.6)" }} />
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#6BB07A", textTransform: "uppercase" as const }}>Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Build map CTA */}
      <button
        onClick={start}
        className="w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group"
        style={{ background: "linear-gradient(135deg, rgba(232,165,71,0.1) 0%, rgba(201,149,71,0.05) 100%)", border: "1px solid rgba(232,165,71,0.3)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,165,71,0.55)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,165,71,0.3)"; }}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(232,165,71,0.1)" }}>
          <ClusterIcon size={16} />
        </div>
        <div className="flex-1 text-left">
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", fontWeight: 500, color: "#E8E9ED" }}>
            Build Knowledge Map
          </div>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC", marginTop: "1px" }}>
            {totalDocs > 0 ? `Cluster ${totalDocs.toLocaleString()} docs into topics for AI querying` : "Cluster your docs into topics for AI querying"}
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#E8A547" strokeWidth="1.4" className="flex-shrink-0">
          <line x1="2" y1="7" x2="12" y2="7" /><polyline points="8,3 12,7 8,11" />
        </svg>
      </button>
    </div>
  );
}

/* ── Running ───────────────────────────────────────────────────────── */

function RunningState() {
  const clustering = useConsolidation();
  const isClustering = clustering.status === "clustering";

  // Prefer cumulative `indexedCount`; fall back to live `docsProcessed`
  // from the stream if the cumulative endpoint hasn't responded yet.
  const docsIndexed = clustering.indexedCount ?? clustering.docsProcessed;

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-xl"
        style={{ background: "rgba(232,165,71,0.04)", border: "1px solid rgba(232,165,71,0.15)" }}
      >
        <SpinnerIcon />
        <div>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "15px", fontWeight: 400, color: "#E8E9ED" }}>
            {isClustering ? "Organizing into topics…" : "Indexing documents…"}
          </div>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC", marginTop: "2px" }}>
            {isClustering ? "Clustering documents into a topic hierarchy" : "Reading and embedding your documents"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          value={docsIndexed != null ? docsIndexed.toLocaleString() : "—"}
          label="Docs indexed"
          active={(docsIndexed ?? 0) > 0}
        />
        <MetricCard
          value={clustering.vectorsIndexed?.toLocaleString() ?? "—"}
          label="Vectors created"
          active={(clustering.vectorsIndexed ?? 0) > 0}
        />
        <MetricCard
          value={clustering.leafTopics?.toString() ?? "—"}
          label="Topics found"
          active={(clustering.leafTopics ?? 0) > 0}
          gold
        />
      </div>

      {(clustering.docsSkipped ?? 0) > 0 && (
        <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#9CA0AC", letterSpacing: "0.1em" }}>
          {clustering.docsSkipped} documents skipped
        </p>
      )}
    </div>
  );
}

/* ── Done ──────────────────────────────────────────────────────────── */

function DoneState() {
  const clustering = useConsolidation();
  const { topics, knowledgeLoading, knowledgeError, refreshKnowledge } = clustering;

  // Lazy-load the topic tree the first time DoneState renders.
  useEffect(() => {
    refreshKnowledge();
  }, [refreshKnowledge]);

  // mcpUrl now comes from the dedicated /mcp-url endpoint (fetched on mount
  // by the context), not the SSE `complete` event — so it's available even
  // without a fresh snapshot run.
  const handleCopy = () => {
    if (clustering.mcpUrl) navigator.clipboard.writeText(clustering.mcpUrl);
  };

  const docsIndexed = clustering.indexedCount ?? clustering.docsProcessed;
  const orphaned = clustering.orphanedCount ?? clustering.docsSkipped ?? 0;

  // Prefer counts derived from the topics tree (source of truth after any
  // recluster). Fall back to the SSE counters from the most recent run.
  const totalTopics =
    topics != null ? topics.length : clustering.totalTopics ?? null;
  const leafTopics = (() => {
    if (!topics) return clustering.leafTopics ?? null;
    const parentIds = new Set<string>();
    for (const t of topics) {
      if (t.parent_topic_id) parentIds.add(t.parent_topic_id);
    }
    return topics.filter((t) => !parentIds.has(t.topic_id)).length;
  })();

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-xl"
        style={{ background: "rgba(107,176,122,0.06)", border: "1px solid rgba(107,176,122,0.2)" }}
      >
        <div className="w-2 h-2 rounded-full bg-[#6BB07A] flex-shrink-0" style={{ boxShadow: "0 0 8px rgba(107,176,122,0.7)" }} />
        <div className="flex-1">
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "15px", fontWeight: 400, color: "#E8E9ED" }}>
            Knowledge map ready
          </div>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC", marginTop: "2px" }}>
            Your documents have been indexed and organised into topics.
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={clustering.recluster}
            disabled={clustering.reclustering}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "9px",
              letterSpacing: "0.15em",
              color: clustering.reclustering ? "#9CA0AC" : "#E8A547",
              textTransform: "uppercase" as const,
              border: "1px solid rgba(232,165,71,0.3)",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: clustering.reclustering ? "default" : "pointer",
              opacity: clustering.reclustering ? 0.6 : 1,
            }}
            className="hover:bg-[rgba(232,165,71,0.08)] transition-all"
          >
            {clustering.reclustering ? "Reclustering…" : "Recluster"}
          </button>
          <button
            onClick={clustering.reset}
            style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#3A3D47", textTransform: "uppercase" as const }}
            className="hover:text-[#9CA0AC] transition-colors"
          >
            Rebuild
          </button>
        </div>
      </div>

      {clustering.reclusterError && (
        <div
          className="px-4 py-2.5 rounded-lg"
          style={{ background: "rgba(201,80,75,0.06)", border: "1px solid rgba(201,80,75,0.2)" }}
        >
          <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#C9534B" }}>
            Recluster failed: {clustering.reclusterError}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <MetricCard value={docsIndexed != null ? docsIndexed.toLocaleString() : "—"} label="Docs indexed" />
        <MetricCard value={totalTopics != null ? totalTopics.toString() : "—"} label="Total topics" gold />
        <MetricCard value={leafTopics != null ? leafTopics.toString() : "—"} label="Leaf topics" />
      </div>

      {clustering.mcpUrl && (
        <div>
          <div className="mb-2" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#9CA0AC", textTransform: "uppercase" as const }}>
            MCP Endpoint
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 px-3 py-2.5 rounded truncate"
              style={{ background: "rgba(58,61,71,0.3)", border: "1px solid rgba(58,61,71,0.5)", fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#9CA0AC", letterSpacing: "0.04em" }}
            >
              {clustering.mcpUrl}
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-2.5 rounded transition-all hover:bg-[rgba(232,165,71,0.12)] flex-shrink-0"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#E8A547", textTransform: "uppercase" as const, border: "1px solid rgba(232,165,71,0.3)" }}
            >
              Copy
            </button>
          </div>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#3A3D47", marginTop: "8px" }}>
            Paste this into claude.ai → Settings → Connectors to access your knowledge from Claude.
          </p>
        </div>
      )}

      <ActivityLog
        docsIndexed={docsIndexed ?? null}
        orphaned={orphaned}
        totalTopics={totalTopics}
        leafTopics={leafTopics}
        vectorsIndexed={clustering.vectorsIndexed ?? null}
        sourceCount={clustering.connections.length}
      />

      <TopicOutline
        topics={topics}
        loading={knowledgeLoading}
        error={knowledgeError}
        onRetry={refreshKnowledge}
      />
    </div>
  );
}

/* ── Activity log ──────────────────────────────────────────────────── */

function ActivityLog({
  docsIndexed,
  orphaned,
  totalTopics,
  leafTopics,
  vectorsIndexed,
  sourceCount,
}: {
  docsIndexed: number | null;
  orphaned: number;
  totalTopics: number | null;
  leafTopics: number | null;
  vectorsIndexed: number | null;
  sourceCount: number;
}) {
  const lines: string[] = [];
  if (sourceCount > 0) lines.push(`Connected to ${sourceCount} source${sourceCount === 1 ? "" : "s"}.`);
  if (docsIndexed != null) lines.push(`Indexed ${docsIndexed.toLocaleString()} document${docsIndexed === 1 ? "" : "s"} into the knowledge base.`);
  if (vectorsIndexed != null && vectorsIndexed > 0) lines.push(`Created ${vectorsIndexed.toLocaleString()} embedding vectors.`);
  if (totalTopics != null && totalTopics > 0) {
    if (leafTopics != null) {
      lines.push(`Organised into ${totalTopics} topic${totalTopics === 1 ? "" : "s"} (${leafTopics} leaf${leafTopics === 1 ? "" : "s"}).`);
    } else {
      lines.push(`Organised into ${totalTopics} topic${totalTopics === 1 ? "" : "s"}.`);
    }
  }
  if (orphaned > 0) lines.push(`Skipped ${orphaned} file${orphaned === 1 ? "" : "s"} (oversized or parse errors).`);

  return (
    <section>
      <SectionLabel text="Activity" />
      <div
        className="rounded-xl px-5 py-4"
        style={{ background: "rgba(58,61,71,0.12)", border: "1px solid rgba(58,61,71,0.3)" }}
      >
        {lines.length === 0 ? (
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 300, color: "#9CA0AC" }}>
            No activity yet.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {lines.map((line, i) => (
              <li
                key={i}
                className="flex gap-3 items-start"
                style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 300, color: "#9CA0AC", lineHeight: 1.55 }}
              >
                <span style={{ color: "#E8A547", lineHeight: 1.55 }}>›</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ── Topic outline ─────────────────────────────────────────────────── */

type TopicNode = Topic & { children: TopicNode[] };

function buildTopicTree(topics: Topic[]): TopicNode[] {
  const byId = new Map<string, TopicNode>();
  for (const t of topics) byId.set(t.topic_id, { ...t, children: [] });
  const roots: TopicNode[] = [];
  for (const node of byId.values()) {
    if (node.parent_topic_id && byId.has(node.parent_topic_id)) {
      byId.get(node.parent_topic_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortByDocs = (a: TopicNode, b: TopicNode) => b.doc_count - a.doc_count;
  roots.sort(sortByDocs);
  for (const node of byId.values()) node.children.sort(sortByDocs);
  return roots;
}

function TopicOutline({
  topics,
  loading,
  error,
  onRetry,
}: {
  topics: Topic[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const tree = useMemo(() => (topics ? buildTopicTree(topics) : []), [topics]);

  return (
    <section>
      <SectionLabel text="Topic Outline" />
      <div
        className="rounded-xl px-5 py-4"
        style={{ background: "rgba(58,61,71,0.12)", border: "1px solid rgba(58,61,71,0.3)" }}
      >
        {error ? (
          <div className="flex items-center justify-between gap-4">
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 300, color: "#C9534B" }}>
              Couldn’t load topics: {error}
            </p>
            <button
              onClick={onRetry}
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#E8A547", textTransform: "uppercase" as const }}
              className="hover:text-[#F5B25F] transition-colors flex-shrink-0"
            >
              Retry
            </button>
          </div>
        ) : loading && !topics ? (
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 300, color: "#9CA0AC" }}>
            Loading topics…
          </p>
        ) : tree.length === 0 ? (
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 300, color: "#9CA0AC" }}>
            No topics yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {tree.map((node) => (
              <TopicOutlineNode key={node.topic_id} node={node} depth={0} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function TopicOutlineNode({ node, depth }: { node: TopicNode; depth: number }) {
  return (
    <li>
      <div
        className="flex items-baseline gap-2 py-1"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        <span style={{ color: depth === 0 ? "#E8A547" : "#3A3D47", fontFamily: "JetBrains Mono, monospace", fontSize: "10px" }}>
          {depth === 0 ? "▾" : "›"}
        </span>
        <span
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: depth === 0 ? "13px" : "12px",
            fontWeight: depth === 0 ? 500 : 300,
            color: depth === 0 ? "#E8E9ED" : "#9CA0AC",
          }}
        >
          {node.label}
        </span>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#3A3D47", letterSpacing: "0.05em" }}>
          · {node.doc_count}
        </span>
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <TopicOutlineNode key={child.topic_id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ── Failed ────────────────────────────────────────────────────────── */

function FailedState() {
  const { error, start } = useConsolidation();
  return (
    <div className="space-y-4">
      <div
        className="px-5 py-4 rounded-xl flex items-start gap-3"
        style={{ background: "rgba(201,80,75,0.06)", border: "1px solid rgba(201,80,75,0.2)" }}
      >
        <span style={{ color: "#C9534B", fontSize: "14px", lineHeight: 1, marginTop: "2px" }}>✕</span>
        <div className="flex-1">
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 400, color: "#C9534B", marginBottom: "4px" }}>
            Consolidation failed
          </div>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC" }}>
            {error ?? "An unexpected error occurred."}
          </div>
        </div>
      </div>
      <button
        onClick={start}
        className="px-5 py-2.5 rounded transition-all hover:bg-[rgba(232,165,71,0.12)]"
        style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", letterSpacing: "0.15em", color: "#E8A547", textTransform: "uppercase" as const, border: "1px solid rgba(232,165,71,0.3)" }}
      >
        Try Again →
      </button>
    </div>
  );
}

/* ── Shared primitives ─────────────────────────────────────────────── */

const COMING_SOON = [
  { id: "notion", name: "Notion", icon: "N" },
  { id: "slack", name: "Slack", icon: "S" },
  { id: "confluence", name: "Confluence", icon: "C" },
  { id: "github", name: "GitHub", icon: "G" },
  { id: "linear", name: "Linear", icon: "L" },
];

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#9CA0AC", textTransform: "uppercase" as const, marginBottom: "10px" }}>
      {text}
    </div>
  );
}

function MetricCard({ value, label, active = true, gold = false }: { value: string; label: string; active?: boolean; gold?: boolean }) {
  return (
    <div
      className="px-4 py-4 rounded-xl"
      style={{ background: "rgba(58,61,71,0.12)", border: "1px solid rgba(58,61,71,0.3)", opacity: active ? 1 : 0.4 }}
    >
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "24px", fontWeight: 500, color: gold ? "#E8A547" : "#E8E9ED", marginBottom: "4px" }}>
        {value}
      </div>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#9CA0AC", textTransform: "uppercase" as const }}>
        {label}
      </div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#E8A547" strokeWidth="1.5" className="flex-shrink-0" style={{ animation: "spin 1s linear infinite" }}>
      <circle cx="8" cy="8" r="6" strokeDasharray="24 14" strokeLinecap="round" />
    </svg>
  );
}

function ClusterIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#E8E9ED" strokeWidth="1.2">
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="3" r="1.5" />
      <circle cx="20" cy="7.5" r="1.5" />
      <circle cx="20" cy="16.5" r="1.5" />
      <circle cx="12" cy="21" r="1.5" />
      <circle cx="4" cy="16.5" r="1.5" />
      <circle cx="4" cy="7.5" r="1.5" />
      <line x1="12" y1="9" x2="12" y2="4.5" />
      <line x1="14.6" y1="10.5" x2="18.5" y2="8.3" />
      <line x1="14.6" y1="13.5" x2="18.5" y2="15.7" />
      <line x1="12" y1="15" x2="12" y2="19.5" />
      <line x1="9.4" y1="13.5" x2="5.5" y2="15.7" />
      <line x1="9.4" y1="10.5" x2="5.5" y2="8.3" />
    </svg>
  );
}

function DriveIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" fill="none">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" opacity="0.8" />
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" opacity="0.8" />
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" opacity="0.8" />
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" opacity="0.8" />
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" opacity="0.8" />
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" opacity="0.8" />
    </svg>
  );
}
