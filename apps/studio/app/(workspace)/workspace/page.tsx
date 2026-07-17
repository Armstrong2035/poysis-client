"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useConsolidation, type Topic } from "./ConsolidationContext";
import { useMockPermissions } from "./MockPermissionsContext";
import { useNotebooks } from "./NotebooksContext";
import { useOnboarding } from "./OnboardingContext";
import {
  CEILING_BG,
  CEILING_COLOR,
  CEILING_DOT,
  CEILING_LABEL,
  type Ceiling,
} from "@/lib/ceiling";

type Phase = "no-sources" | "has-sources" | "running" | "done" | "failed";

function getPhase(status: string, hasConnections: boolean): Phase {
  if (!hasConnections) return "no-sources";
  if (status === "running" || status === "clustering") return "running";
  if (status === "done") return "done";
  if (status === "failed") return "failed";
  return "has-sources";
}

type ClusterNode = {
  id: string;
  name: string;
  docCount: number;
  updatedAt?: string;
  subs: Topic[];
  topic: Topic;
};

type ClusterDocument = {
  source_id: string;
  title: string;
  url: string;
  snippet: string;
};

const CLUSTER_DOCS_DISPLAY_LIMIT = 50;

function buildClusters(topics: Topic[] | null): ClusterNode[] {
  if (!topics || topics.length === 0) return [];
  const byId = new Map<string, Topic>();
  const childrenOf = new Map<string, Topic[]>();
  for (const t of topics) {
    byId.set(t.topic_id, t);
    if (t.parent_topic_id) {
      const list = childrenOf.get(t.parent_topic_id) ?? [];
      list.push(t);
      childrenOf.set(t.parent_topic_id, list);
    }
  }
  const roots = topics
    .filter((t) => !t.parent_topic_id || !byId.has(t.parent_topic_id))
    .sort((a, b) => b.doc_count - a.doc_count);

  return roots.map((root) => ({
    id: root.topic_id,
    name: root.label,
    docCount: root.doc_count,
    updatedAt: root.updated_at,
    subs: (childrenOf.get(root.topic_id) ?? []).sort(
      (a, b) => b.doc_count - a.doc_count,
    ),
    topic: root,
  }));
}

export default function KnowledgeMapPage() {
  const clustering = useConsolidation();
  const { status, connections } = clustering;
  const phase = getPhase(status, connections.length > 0);

  return (
    <div style={{ padding: "36px 44px", maxWidth: "1180px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-source-serif), serif",
              fontSize: "30px",
              fontWeight: 600,
              marginBottom: "4px",
              color: "#262922",
            }}
          >
            Knowledge Map
          </div>
          <div style={{ fontSize: "14px", color: "#55594D" }}>
            What you have, and how it&apos;s organized.
          </div>
        </div>
        {phase === "done" && <ConnectToClaudeButton />}
      </div>

      {phase === "no-sources" && <NoSourcesState />}
      {phase === "has-sources" && <HasSourcesState />}
      {phase === "running" && <RunningState />}
      {phase === "failed" && <FailedState />}
      {phase === "done" && (
        <Suspense fallback={null}>
          <ClusterGrid />
        </Suspense>
      )}
    </div>
  );
}

/* ── Empty / transitional states ──────────────────────────────────── */

function NoSourcesState() {
  return (
    <EmptyCard
      title="Connect a source to get started"
      body="Poysis organizes what you already have into clusters. Link Google Drive to begin."
      action={{ label: "Go to Sources", href: "/workspace/sources" }}
    />
  );
}

function HasSourcesState() {
  const { start, connections } = useConsolidation();
  const totalDocs = connections.reduce((sum, c) => sum + (c.doc_count ?? 0), 0);
  return (
    <EmptyCard
      title="Build your Knowledge Map"
      body={
        totalDocs > 0
          ? `Cluster ${totalDocs.toLocaleString()} documents into topics you can browse and query.`
          : "Cluster your documents into topics you can browse and query."
      }
      action={{ label: "Build Knowledge Map", onClick: start }}
    />
  );
}

function RunningState() {
  const clustering = useConsolidation();
  const isClustering = clustering.status === "clustering";
  const docsIndexed = clustering.docsProcessed ?? clustering.indexedCount;
  return (
    <EmptyCard
      title={isClustering ? "Organizing into clusters…" : "Indexing documents…"}
      body={
        isClustering
          ? "Grouping documents into a topic hierarchy."
          : `Reading and embedding your documents${docsIndexed ? ` — ${docsIndexed.toLocaleString()} so far` : ""}.`
      }
      spinner
    />
  );
}

function FailedState() {
  const { error, start } = useConsolidation();
  return (
    <EmptyCard
      title="Consolidation failed"
      body={error ?? "An unexpected error occurred."}
      tone="error"
      action={{ label: "Try again", onClick: start }}
    />
  );
}

function EmptyCard({
  title,
  body,
  action,
  spinner,
  tone,
}: {
  title: string;
  body: string;
  action?: { label: string; href?: string; onClick?: () => void };
  spinner?: boolean;
  tone?: "error";
}) {
  return (
    <div
      style={{
        background: "#FAF8F0",
        border: `1px solid ${tone === "error" ? "#E3C9C4" : "#E4DECC"}`,
        borderRadius: "14px",
        padding: "26px",
        maxWidth: "560px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {spinner && (
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#C99A5C",
              animation: "pulseSync 1.4s infinite",
            }}
          />
        )}
        <div
          style={{
            fontFamily: "var(--font-source-serif), serif",
            fontSize: "17px",
            fontWeight: 600,
            color: tone === "error" ? "#7E3A33" : "#262922",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ fontSize: "13.5px", color: "#55594D", lineHeight: 1.5 }}>
        {body}
      </div>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            style={{
              alignSelf: "flex-start",
              marginTop: "6px",
              padding: "10px 16px",
              borderRadius: "9px",
              border: "none",
              background: "#3C4A3A",
              color: "#FAF8F0",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            style={{
              alignSelf: "flex-start",
              cursor: "pointer",
              marginTop: "6px",
              padding: "10px 16px",
              borderRadius: "9px",
              border: "none",
              background: "#3C4A3A",
              color: "#FAF8F0",
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}

/* ── Cluster grid + detail drawer ─────────────────────────────────── */

// A sub-cluster has no children of its own in today's data model (topics are
// only ever two levels deep), so it can be opened in the same drawer as a
// top-level cluster by wrapping it as a childless ClusterNode.
function subAsNode(sub: Topic): ClusterNode {
  return {
    id: sub.topic_id,
    name: sub.label,
    docCount: sub.doc_count,
    updatedAt: sub.updated_at,
    subs: [],
    topic: sub,
  };
}

function findNode(clusters: ClusterNode[], id: string): ClusterNode | null {
  for (const c of clusters) {
    if (c.id === id) return c;
    const sub = c.subs.find((s) => s.topic_id === id);
    if (sub) return subAsNode(sub);
  }
  return null;
}

function ClusterGrid() {
  const {
    topics,
    knowledgeLoading,
    knowledgeError,
    refreshKnowledge,
    reclustering,
    recluster,
  } = useConsolidation();
  const { getCeiling, getLocked } = useMockPermissions();
  const { markDone } = useOnboarding();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const deepLinkAppliedRef = useRef(false);

  useEffect(() => {
    // Topics/stories are cached in ConsolidationProvider (layout-level) for the
    // whole workspace session — only fetch if nothing's loaded yet, so
    // navigating back to this page doesn't re-pay the worker round trip.
    if (topics === null) refreshKnowledge();
  }, [topics, refreshKnowledge]);

  const clusters = useMemo(() => buildClusters(topics), [topics]);
  const selected = selectedId ? findNode(clusters, selectedId) : null;

  // Deep-link support (?cluster=<topic_id>) — lets Canvas's cluster drawer
  // link straight back to this cluster's drawer here. Only applies once per
  // page load so manually closing the drawer afterward sticks.
  useEffect(() => {
    if (deepLinkAppliedRef.current) return;
    const clusterParam = searchParams.get("cluster");
    if (!clusterParam || clusters.length === 0) return;
    deepLinkAppliedRef.current = true;
    if (findNode(clusters, clusterParam)) setSelectedId(clusterParam);
  }, [searchParams, clusters]);

  if (knowledgeError && !topics) {
    return (
      <EmptyCard
        title="Couldn't load your clusters"
        body={knowledgeError}
        tone="error"
        action={{ label: "Retry", onClick: refreshKnowledge }}
      />
    );
  }
  if (knowledgeLoading && !topics) {
    return (
      <EmptyCard
        title="Loading your Knowledge Map…"
        body="Fetching clusters."
        spinner
      />
    );
  }
  if (clusters.length === 0) {
    return (
      <EmptyCard
        title="No clusters yet"
        body="Run a knowledge consolidation to see clusters here."
      />
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "14px",
        }}
      >
        <button
          onClick={recluster}
          disabled={reclustering}
          style={{
            cursor: reclustering ? "default" : "pointer",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid #E4DECC",
            background: "transparent",
            fontSize: "12.5px",
            fontWeight: 600,
            color: reclustering ? "#8A9488" : "#55594D",
          }}
        >
          {reclustering ? "Reclustering…" : "Recluster"}
        </button>
      </div>

      <ClusterTree
        clusters={clusters}
        getCeiling={getCeiling}
        getLocked={getLocked}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          markDone("viewedCluster");
        }}
      />

      {selected && (
        <ClusterDrawer cluster={selected} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}

/* ── Cluster tree (top-level categories, expanding into sub-clusters) ── */

function ClusterTree({
  clusters,
  getCeiling,
  getLocked,
  selectedId,
  onSelect,
}: {
  clusters: ClusterNode[];
  getCeiling: (id: string) => Ceiling;
  getLocked: (id: string) => boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  // Single-expand accordion: opening a category closes whichever was open,
  // so the list never grows taller than category-count + one expanded
  // category's children — no overlap/collision layout to compute.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div
      style={{
        background: "#FAF8F0",
        border: "1px solid #E4DECC",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      {clusters.map((cluster, i) => (
        <ClusterTreeRow
          key={cluster.id}
          cluster={cluster}
          ceiling={getCeiling(cluster.id)}
          locked={getLocked(cluster.id)}
          expanded={expandedId === cluster.id}
          selectedId={selectedId}
          getCeiling={getCeiling}
          getLocked={getLocked}
          isLast={i === clusters.length - 1}
          onToggle={() =>
            setExpandedId((prev) => (prev === cluster.id ? null : cluster.id))
          }
          onSelect={() => onSelect(cluster.id)}
          onSelectSub={(subId) => onSelect(subId)}
        />
      ))}
    </div>
  );
}

function ClusterTreeRow({
  cluster,
  ceiling,
  locked,
  expanded,
  selectedId,
  getCeiling,
  getLocked,
  isLast,
  onToggle,
  onSelect,
  onSelectSub,
}: {
  cluster: ClusterNode;
  ceiling: Ceiling;
  locked: boolean;
  expanded: boolean;
  selectedId: string | null;
  getCeiling: (id: string) => Ceiling;
  getLocked: (id: string) => boolean;
  isLast: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onSelectSub: (subId: string) => void;
}) {
  const hasSubs = cluster.subs.length > 0;
  const isSelected = selectedId === cluster.id;

  return (
    <div style={{ borderBottom: isLast && !expanded ? "none" : "1px solid #E4DECC" }}>
      <button
        onClick={() => {
          if (hasSubs) onToggle();
          onSelect();
        }}
        style={{
          width: "100%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 18px",
          background: isSelected ? "#F1EEE2" : "transparent",
          border: "none",
          textAlign: "left",
        }}
      >
        <span
          style={{
            width: "14px",
            flexShrink: 0,
            fontSize: "11px",
            color: "#8A9488",
            visibility: hasSubs ? "visible" : "hidden",
          }}
        >
          {expanded ? "▾" : "▸"}
        </span>
        <span
          style={{
            width: "9px",
            height: "9px",
            borderRadius: "50%",
            flexShrink: 0,
            background: CEILING_DOT[ceiling],
          }}
        />
        <span
          style={{
            flex: 1,
            fontFamily: "var(--font-source-serif), serif",
            fontWeight: 600,
            fontSize: "15.5px",
            color: "#262922",
          }}
        >
          {cluster.name}
        </span>
        {locked && (
          <span title="Locked — recluster will skip this cluster" style={{ fontSize: "12px" }}>
            🔒
          </span>
        )}
        <span style={{ fontSize: "12px", color: "#8A9488", flexShrink: 0 }}>
          {cluster.docCount} docs
        </span>
      </button>

      {expanded && hasSubs && (
        <div
          style={{
            marginLeft: "35px",
            borderLeft: "1px solid #E4DECC",
            paddingBottom: "6px",
          }}
        >
          {cluster.subs.map((sub) => {
            const subSelected = selectedId === sub.topic_id;
            return (
              <button
                key={sub.topic_id}
                onClick={() => onSelectSub(sub.topic_id)}
                style={{
                  position: "relative",
                  width: "100%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 14px 9px 24px",
                  background: subSelected ? "#F1EEE2" : "transparent",
                  border: "none",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    width: "14px",
                    height: "1px",
                    background: "#E4DECC",
                  }}
                />
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: CEILING_DOT[getCeiling(sub.topic_id)],
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: "13.5px",
                    color: "#262922",
                  }}
                >
                  {sub.label}
                </span>
                {getLocked(sub.topic_id) && (
                  <span title="Locked — recluster will skip this cluster" style={{ fontSize: "11px" }}>
                    🔒
                  </span>
                )}
                <span style={{ fontSize: "11.5px", color: "#8A9488", flexShrink: 0 }}>
                  {sub.doc_count} docs
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClusterDrawer({
  cluster,
  onClose,
}: {
  cluster: ClusterNode;
  onClose: () => void;
}) {
  const router = useRouter();
  const { getCeiling, setCeiling, getLocked, setLocked } = useMockPermissions();
  const { dependentsOf, createNotebook } = useNotebooks();
  const { markDone } = useOnboarding();
  const [building, setBuilding] = useState(false);
  const ceiling = getCeiling(cluster.id);
  const locked = getLocked(cluster.id);
  const topic = cluster.topic;
  const deps = dependentsOf(cluster.id);

  const [documents, setDocuments] = useState<ClusterDocument[] | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDocuments(null);
    setDocsError(null);
    setDocsLoading(true);
    fetch(`/api/worker/consolidation/topic-documents?topic_id=${encodeURIComponent(cluster.id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setDocuments(data.documents ?? []);
      })
      .catch((err) => {
        if (!cancelled) setDocsError(err?.message ?? "Failed to load documents");
      })
      .finally(() => {
        if (!cancelled) setDocsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cluster.id]);

  const buildNotebook = async () => {
    if (building) return;
    setBuilding(true);
    try {
      const nb = await createNotebook({
        name: `${cluster.name} Notebook`,
        clusterIds: [cluster.id],
        ceiling,
      });
      router.push(`/workspace/canvas?notebook=${nb.id}`);
    } catch (err) {
      console.error("Failed to build notebook from cluster:", err);
      setBuilding(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(38,41,34,0.28)",
          zIndex: 20,
        }}
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
          gap: "16px",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.08)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "3px 9px",
                borderRadius: "20px",
                display: "inline-block",
                marginBottom: "8px",
                background: CEILING_BG[ceiling],
                color: CEILING_COLOR[ceiling],
              }}
            >
              {CEILING_LABEL[ceiling]}
            </div>
            <div
              style={{
                fontFamily: "var(--font-source-serif), serif",
                fontWeight: 600,
                fontSize: "20px",
                color: "#262922",
              }}
            >
              {cluster.name}
            </div>
          </div>
          <div
            onClick={onClose}
            style={{ cursor: "pointer", color: "#8A9488", fontSize: "18px" }}
          >
            ✕
          </div>
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "#55594D",
            display: "flex",
            gap: "16px",
          }}
        >
          <span>{cluster.docCount} documents</span>
          <span>{cluster.subs.length} sub-clusters</span>
        </div>

        <div style={{ borderTop: "1px solid #E4DECC", paddingTop: "14px" }}>
          <SectionLabel text="Ceiling" />
          <div
            style={{ fontSize: "12px", color: "#8A9488", marginBottom: "8px" }}
          >
            The farthest this cluster&apos;s contents may ever reach. (Editable
            here for now — will move into Canvas&apos;s propose/confirm flow.)
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["private", "team", "public"] as Ceiling[]).map((c) => {
              const locked = c === "team";
              return (
                <button
                  key={c}
                  disabled={locked}
                  title={locked ? "Team — coming soon" : undefined}
                  onClick={() => {
                    if (locked) return;
                    setCeiling(cluster.id, c);
                    markDone("changedCeiling");
                  }}
                  style={{
                    cursor: locked ? "not-allowed" : "pointer",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    opacity: locked ? 0.5 : 1,
                    background: ceiling === c ? CEILING_BG[c] : "transparent",
                    color: ceiling === c ? CEILING_COLOR[c] : "#8A9488",
                    border: `1px solid ${ceiling === c ? CEILING_COLOR[c] + "55" : "#E4DECC"}`,
                  }}
                >
                  {CEILING_LABEL[c]}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #E4DECC", paddingTop: "14px" }}>
          <SectionLabel text="Recluster lock" />
          <div
            style={{ fontSize: "12px", color: "#8A9488", marginBottom: "8px" }}
          >
            {locked
              ? "Locked — recluster will skip this cluster, keeping your edits."
              : "Unlocked — recluster can rename, merge, or reshape this cluster."}
          </div>
          <button
            onClick={() => setLocked(cluster.id, !locked)}
            style={{
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              background: locked ? "#F3E5E3" : "transparent",
              color: locked ? "#7E3A33" : "#8A9488",
              border: `1px solid ${locked ? "#7E3A3355" : "#E4DECC"}`,
            }}
          >
            {locked ? "🔒 Locked" : "🔓 Lock this cluster"}
          </button>
        </div>

        {topic.semantic_summary && (
          <DrawerSection label="Summary">
            <p style={{ fontSize: "13px", color: "#262922", lineHeight: 1.6 }}>
              {topic.semantic_summary}
            </p>
          </DrawerSection>
        )}

        {topic.key_themes && topic.key_themes.length > 0 && (
          <DrawerSection label="Key themes">
            <ChipList items={topic.key_themes} />
          </DrawerSection>
        )}

        {topic.keywords && topic.keywords.length > 0 && (
          <DrawerSection label="Keywords">
            <ChipList items={topic.keywords} subtle />
          </DrawerSection>
        )}

        {cluster.subs.length > 0 && (
          <DrawerSection label="Sub-clusters">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {cluster.subs.map((s) => (
                <div
                  key={s.topic_id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    color: "#262922",
                    padding: "6px 0",
                    borderBottom: "1px solid #F1EEE2",
                  }}
                >
                  <span>{s.label}</span>
                  <span style={{ color: "#8A9488" }}>{s.doc_count}</span>
                </div>
              ))}
            </div>
          </DrawerSection>
        )}

        <div style={{ borderTop: "1px solid #E4DECC", paddingTop: "14px" }}>
          <SectionLabel text="Dependents" />
          <div style={{ fontSize: "13px", color: "#262922" }}>
            {deps.length ? deps.map((n) => n.name).join(", ") : "None yet"}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #E4DECC", paddingTop: "14px" }}>
          <SectionLabel text="Documents" />
          {docsLoading && (
            <div style={{ fontSize: "12.5px", color: "#8A9488" }}>Loading…</div>
          )}
          {!docsLoading && docsError && (
            <div style={{ fontSize: "12.5px", color: "#7E3A33" }}>
              Couldn&apos;t load documents: {docsError}
            </div>
          )}
          {!docsLoading && !docsError && documents && documents.length === 0 && (
            <div style={{ fontSize: "12.5px", color: "#8A9488" }}>
              No documents indexed in this cluster yet.
            </div>
          )}
          {!docsLoading && !docsError && documents && documents.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "260px",
                overflowY: "auto",
              }}
            >
              {documents.slice(0, CLUSTER_DOCS_DISPLAY_LIMIT).map((doc) => (
                <div
                  key={doc.source_id}
                  style={{
                    padding: "9px 10px",
                    background: "#F1EEE2",
                    border: "1px solid #E4DECC",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#262922",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doc.title || "Untitled document"}
                    </div>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#7E3A33", fontSize: "12px", flexShrink: 0 }}
                      >
                        Open ↗
                      </a>
                    )}
                  </div>
                  {doc.snippet && (
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "#8A9488",
                        marginTop: "3px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {doc.snippet}
                    </div>
                  )}
                </div>
              ))}
              {documents.length > CLUSTER_DOCS_DISPLAY_LIMIT && (
                <div style={{ fontSize: "11.5px", color: "#8A9488" }}>
                  +{documents.length - CLUSTER_DOCS_DISPLAY_LIMIT} more
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />
        <button
          onClick={buildNotebook}
          style={{
            cursor: "pointer",
            padding: "12px 14px",
            borderRadius: "9px",
            border: "none",
            background: "#3C4A3A",
            color: "#FAF8F0",
            fontWeight: 600,
            fontSize: "13.5px",
            textAlign: "left",
          }}
        >
          Build a notebook from this cluster →
        </button>
      </div>
    </>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "#8A9488",
        marginBottom: "8px",
      }}
    >
      {text}
    </div>
  );
}

function DrawerSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <SectionLabel text={label} />
      {children}
    </div>
  );
}

function ChipList({
  items,
  subtle = false,
}: {
  items: string[];
  subtle?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            fontSize: "11px",
            padding: "4px 9px",
            borderRadius: "6px",
            background: subtle ? "#F1EEE2" : "#FBF3E4",
            border: `1px solid ${subtle ? "#E4DECC" : "#EAD3A8"}`,
            color: subtle ? "#55594D" : "#9C6B2E",
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/* ── Connect to Claude modal (real MCP endpoint) ──────────────────── */

function ConnectToClaudeButton() {
  const { mcpUrl } = useConsolidation();
  const [open, setOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<
    "endpoint" | "config" | null
  >(null);

  const configSnippet = mcpUrl
    ? `{\n  "mcpServers": {\n    "poysis": {\n      "url": "${mcpUrl}"\n    }\n  }\n}`
    : "";

  const copy = (text: string, which: "endpoint" | "config") => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopyFeedback(which);
    setTimeout(() => setCopyFeedback((c) => (c === which ? null : c)), 1500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "11px 16px",
          borderRadius: "9px",
          border: "1px solid #E4DECC",
          background: "#FAF8F0",
          fontWeight: 600,
          fontSize: "13px",
          color: "#262922",
        }}
      >
        <span style={{ color: "#C99A5C" }}>✦</span> Connect to Claude
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(38,41,34,0.35)",
              zIndex: 32,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "8vh",
              left: "50%",
              transform: "translateX(-50%)",
              width: "600px",
              maxWidth: "92vw",
              maxHeight: "84vh",
              overflowY: "auto",
              background: "#FAF8F0",
              borderRadius: "16px",
              zIndex: 33,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              padding: "28px 30px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "6px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "9px" }}
              >
                <span style={{ color: "#C99A5C", fontSize: "17px" }}>✦</span>
                <div
                  style={{
                    fontFamily: "var(--font-source-serif), serif",
                    fontWeight: 600,
                    fontSize: "21px",
                    color: "#262922",
                  }}
                >
                  Connect the Knowledge Map to Claude
                </div>
              </div>
              <div
                onClick={() => setOpen(false)}
                style={{
                  cursor: "pointer",
                  color: "#8A9488",
                  fontSize: "18px",
                }}
              >
                ✕
              </div>
            </div>
            <div
              style={{
                fontSize: "13.5px",
                color: "#55594D",
                lineHeight: 1.6,
                marginBottom: "20px",
              }}
            >
              One MCP endpoint for everything in your workspace. Claude queries
              live across every cluster you&apos;ve indexed.
            </div>

            {mcpUrl ? (
              <>
                <SectionLabel text="Your endpoint" />
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "18px" }}
                >
                  <div
                    style={{
                      flex: 1,
                      fontFamily: "monospace",
                      fontSize: "12.5px",
                      background: "#F1EEE2",
                      border: "1px solid #E4DECC",
                      borderRadius: "7px",
                      padding: "10px 12px",
                      overflowX: "auto",
                      whiteSpace: "nowrap",
                      color: "#262922",
                    }}
                  >
                    {mcpUrl}
                  </div>
                  <button
                    onClick={() => copy(mcpUrl, "endpoint")}
                    style={{
                      cursor: "pointer",
                      padding: "0 14px",
                      borderRadius: "7px",
                      border: "1px solid #E4DECC",
                      background: "#FAF8F0",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#55594D",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {copyFeedback === "endpoint" ? "Copied ✓" : "Copy"}
                  </button>
                </div>

                <SectionLabel text="Setup steps" />
                <ol
                  style={{
                    margin: "0 0 18px 0",
                    paddingLeft: "18px",
                    fontSize: "13px",
                    color: "#262922",
                    lineHeight: 1.9,
                  }}
                >
                  <li>
                    In Claude, open{" "}
                    <b>Settings → Connectors → Add custom connector</b>.
                  </li>
                  <li>
                    Paste the endpoint above and name it &quot;Poysis&quot;.
                  </li>
                  <li>Approve the access request.</li>
                  <li>
                    Ask Claude anything about your knowledge — it queries live
                    across every cluster.
                  </li>
                </ol>

                <SectionLabel text="Or add manually (claude_desktop_config.json)" />
                <div style={{ display: "flex", gap: "8px" }}>
                  <div
                    style={{
                      flex: 1,
                      fontFamily: "monospace",
                      fontSize: "11.5px",
                      background: "#F1EEE2",
                      border: "1px solid #E4DECC",
                      borderRadius: "7px",
                      padding: "10px 12px",
                      whiteSpace: "pre-wrap",
                      color: "#262922",
                      lineHeight: 1.5,
                    }}
                  >
                    {configSnippet}
                  </div>
                  <button
                    onClick={() => copy(configSnippet, "config")}
                    style={{
                      cursor: "pointer",
                      padding: "0 14px",
                      borderRadius: "7px",
                      border: "1px solid #E4DECC",
                      background: "#FAF8F0",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#55594D",
                      whiteSpace: "nowrap",
                      alignSelf: "flex-start",
                    }}
                  >
                    {copyFeedback === "config" ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ fontSize: "13px", color: "#8A9488" }}>
                No MCP endpoint yet — run a consolidation first.
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
