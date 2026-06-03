"use client";

import { useState, useRef, useEffect, useMemo, memo } from "react";
import {
  useConsolidation,
  type Topic,
  type Story,
} from "../ConsolidationContext";

type Tab = "topics" | "stories";

type SubCluster = {
  id: string;
  name: string;
  count: number;
  topic: Topic;
};

type Cluster = {
  id: string;
  name: string;
  count: number;
  angle: number;
  topic: Topic;
  subs: SubCluster[];
};

const RADIUS = 240;
const SUB_RADIUS = 130;

function buildClusters(topics: Topic[] | null): Cluster[] {
  if (!topics || topics.length === 0) return [];

  // Build id → topic map and a parent→children map.
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

  const total = roots.length;

  return roots.map((root, i) => {
    const directChildren = (childrenOf.get(root.topic_id) ?? []).sort(
      (a, b) => b.doc_count - a.doc_count
    );
    return {
      id: root.topic_id,
      name: root.label,
      count: root.doc_count,
      angle: total > 0 ? (i / total) * 360 - 90 : 0,
      topic: root,
      subs: directChildren.map((child) => ({
        id: child.topic_id,
        name: child.label,
        count: child.doc_count,
        topic: child,
      })),
    };
  });
}

function getClusterPos(angle: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: Math.cos(rad) * RADIUS, y: Math.sin(rad) * RADIUS };
}

function getSubClusterPos(index: number, total: number, baseAngle: number) {
  const angle =
    (index / total) * Math.PI * 2 - Math.PI / 2 + (baseAngle * Math.PI) / 180;
  return { x: Math.cos(angle) * SUB_RADIUS, y: Math.sin(angle) * SUB_RADIUS };
}

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];
    const create = () => {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.36,
        vy: (Math.random() - 0.5) * 0.36,
        life: Math.random() * 0.5 + 0.5,
      });
    };
    Array.from({ length: 40 }).forEach(create);

    let rafId = 0;
    const animate = () => {
      ctx.fillStyle = "rgba(10, 11, 15, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.004;
        if (p.life <= 0) {
          particles.splice(i, 1);
          create();
        } else {
          ctx.fillStyle = `rgba(232, 165, 71, ${p.life * 0.45})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(232, 165, 71, ${(1 - dist / 140) * 0.1})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }} />;
}

export default function VisualizeKnowledgePage() {
  const {
    topics,
    stories,
    knowledgeLoading,
    knowledgeError,
    refreshKnowledge,
    status,
    reclustering,
    reclusterError,
    recluster,
  } = useConsolidation();
  const [tab, setTab] = useState<Tab>("topics");

  useEffect(() => {
    refreshKnowledge();
  }, [refreshKnowledge]);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: "#0A0B0F", color: "#E8E9ED", overflow: "hidden" }}>
      <header
        className="flex items-center justify-between px-8 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(58,61,71,0.4)", background: "rgba(10,11,15,0.85)", zIndex: 30 }}
      >
        <div>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em", color: "#E8E9ED" }}>
            Visualize Knowledge
          </h1>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC", marginTop: "2px" }}>
            Topics organise your knowledge base; stories thread topics into narratives.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={recluster}
            disabled={reclustering}
            title={reclusterError ?? undefined}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "10px",
              letterSpacing: "0.15em",
              color: reclustering ? "#9CA0AC" : reclusterError ? "#C9534B" : "#E8A547",
              textTransform: "uppercase" as const,
              border: `1px solid ${reclusterError ? "rgba(201,80,75,0.4)" : "rgba(232,165,71,0.3)"}`,
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: reclustering ? "default" : "pointer",
              opacity: reclustering ? 0.6 : 1,
              background: "transparent",
            }}
            className="hover:bg-[rgba(232,165,71,0.08)] transition-all"
          >
            {reclustering ? "Reclustering…" : reclusterError ? "Retry recluster" : "Recluster"}
          </button>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(58,61,71,0.2)", border: "1px solid rgba(58,61,71,0.4)" }}>
            <TabButton active={tab === "topics"} onClick={() => setTab("topics")}>
              Topics{topics ? ` · ${topics.length}` : ""}
            </TabButton>
            <TabButton active={tab === "stories"} onClick={() => setTab("stories")}>
              Stories{stories ? ` · ${stories.length}` : ""}
            </TabButton>
          </div>
        </div>
      </header>

      <div className="relative flex-1" style={{ overflow: "hidden" }}>
        {/* Both views stay mounted; the inactive one is hidden. Keeps
            Particles, cluster selection, and zoom state across tab switches. */}
        <div
          className="absolute inset-0"
          style={{
            opacity: tab === "topics" ? 1 : 0,
            pointerEvents: tab === "topics" ? "auto" : "none",
            willChange: "opacity",
          }}
          aria-hidden={tab !== "topics"}
        >
          <TopicsView
            topics={topics}
            loading={knowledgeLoading}
            error={knowledgeError}
            onRetry={refreshKnowledge}
            status={status}
            active={tab === "topics"}
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            opacity: tab === "stories" ? 1 : 0,
            pointerEvents: tab === "stories" ? "auto" : "none",
            willChange: "opacity",
          }}
          aria-hidden={tab !== "stories"}
        >
          <StoriesView
            stories={stories}
            topics={topics}
            loading={knowledgeLoading}
            error={knowledgeError}
            onRetry={refreshKnowledge}
          />
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded transition-all"
      style={{
        background: active ? "rgba(232,165,71,0.12)" : "transparent",
        border: `1px solid ${active ? "rgba(232,165,71,0.3)" : "transparent"}`,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "10px",
        letterSpacing: "0.15em",
        color: active ? "#E8A547" : "#9CA0AC",
        textTransform: "uppercase",
      }}
    >
      {children}
    </button>
  );
}

/* ── Topics view (radial map) ──────────────────────────────────────── */

const TopicsView = memo(function TopicsView({
  topics,
  loading,
  error,
  onRetry,
  status,
  active,
}: {
  topics: Topic[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  status: string;
  active: boolean;
}) {
  const clusters = useMemo(() => buildClusters(topics), [topics]);

  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [activeSubCluster, setActiveSubCluster] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const mapRef = useRef<HTMLDivElement>(null);

  const activeClusterData = clusters.find((c) => c.id === activeCluster);
  const activeSubData = activeClusterData?.subs.find((s) => s.id === activeSubCluster);

  const isZoomed = activeCluster !== null;
  const isSubZoomed = activeSubCluster !== null;
  const activePos = activeClusterData ? getClusterPos(activeClusterData.angle) : null;

  useEffect(() => {
    // Don't intercept keys when this tab is hidden behind Stories.
    if (!active) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (activeSubCluster) setActiveSubCluster(null);
        else if (activeCluster) setActiveCluster(null);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (!activeCluster && clusters.length > 0) setActiveCluster(clusters[0].id);
        else if (!activeSubCluster && activeClusterData?.subs[0]) setActiveSubCluster(activeClusterData.subs[0].id);
        return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const isNext = e.key === "ArrowRight" || e.key === "ArrowDown";
        if (activeSubCluster && activeClusterData) {
          const subs = activeClusterData.subs;
          const idx = subs.findIndex((s) => s.id === activeSubCluster);
          const next = isNext ? (idx + 1) % subs.length : (idx - 1 + subs.length) % subs.length;
          setActiveSubCluster(subs[next].id);
          return;
        }
        if (!activeCluster && clusters.length > 0) {
          setActiveCluster(clusters[0].id);
          return;
        }
        if (activeCluster && clusters.length > 0) {
          const idx = clusters.findIndex((c) => c.id === activeCluster);
          const next = isNext ? (idx + 1) % clusters.length : (idx - 1 + clusters.length) % clusters.length;
          setActiveCluster(clusters[next].id);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, activeCluster, activeSubCluster, clusters, activeClusterData]);

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomLevel((prev) => {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        return Math.max(0.5, Math.min(3, prev * delta));
      });
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  if (error) {
    return <CenteredMessage tone="error" message={`Couldn't load topics: ${error}`} actionLabel="Retry" onAction={onRetry} />;
  }
  if (loading && !topics) {
    return <CenteredMessage tone="muted" message="Loading topics…" />;
  }
  if (clusters.length === 0) {
    const message =
      status === "done"
        ? "No topics yet. Try rebuilding the knowledge map."
        : "Run a knowledge consolidation to see topics here.";
    return <CenteredMessage tone="muted" message={message} />;
  }

  return (
    <>
      <Particles />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(20,22,29,0) 0%, rgba(6,7,10,0.8) 100%)",
          zIndex: 5,
        }}
      />

      {/* Key hint bar — centered within map area (drawer takes 384px on the right) */}
      <div
        className="absolute top-6 flex gap-4 items-center"
        style={{
          left: "calc((100% - 384px) / 2)",
          transform: "translateX(-50%)",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "10px",
          color: "rgba(156, 160, 172, 0.55)",
          letterSpacing: "0.12em",
          zIndex: 20,
        }}
      >
        {[
          { keys: "↑ ↓ ← →", label: "NAVIGATE" },
          { keys: "⏎", label: isSubZoomed ? "OPEN" : "ZOOM" },
          { keys: "⎋", label: "EXIT" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="px-2 py-1 border border-[rgba(156,160,172,0.3)]"
              style={{ fontSize: "9px", background: "rgba(20, 22, 29, 0.5)", borderRadius: "3px" }}
            >
              {item.keys}
            </div>
            <span className="text-[9px]">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Map stage — offset right edge to leave room for the persistent drawer */}
      <div className="absolute top-0 bottom-0 left-0 flex items-center justify-center" style={{ right: "384px", zIndex: 10 }}>
        <div
          ref={mapRef}
          className="relative"
          style={{
            width: "800px",
            height: "800px",
            transform: `scale(${zoomLevel})`,
            transition: "transform 100ms ease-out",
            transformOrigin: "center",
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 800 800"
            style={{
              transform: isZoomed && activePos
                ? `translate(${-activePos.x * 1.2}px, ${-activePos.y * 1.2}px) scale(${isSubZoomed ? 2.1 : 1.45})`
                : "translate(0, 0) scale(1)",
              transition: "transform 400ms cubic-bezier(0.32, 0.72, 0.35, 1.05)",
            }}
          >
            {clusters.map((cluster) => {
              const pos = getClusterPos(cluster.angle);
              return (
                <line
                  key={`line-${cluster.id}`}
                  x1="400"
                  y1="400"
                  x2={400 + pos.x}
                  y2={400 + pos.y}
                  stroke="rgba(58, 61, 71, 0.5)"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                />
              );
            })}

            {clusters.map((cluster, i) => {
              const next = clusters[(i + 1) % clusters.length];
              const p1 = getClusterPos(cluster.angle);
              const p2 = getClusterPos(next.angle);
              return (
                <line
                  key={`arc-${cluster.id}`}
                  x1={400 + p1.x}
                  y1={400 + p1.y}
                  x2={400 + p2.x}
                  y2={400 + p2.y}
                  stroke="rgba(58, 61, 71, 0.25)"
                  strokeWidth="0.5"
                />
              );
            })}

            <circle
              cx="400"
              cy="400"
              r="14"
              fill="#E8A547"
              style={{ filter: "drop-shadow(0 0 24px #E8A547)", animation: "pulse-soft 2s ease-in-out infinite" }}
            />
          </svg>

          {clusters.map((cluster) => {
            const pos = getClusterPos(cluster.angle);
            const isFocused = activeCluster === cluster.id;
            const isDimmed = isZoomed && !isFocused;
            const size = isFocused ? 78 : 64;
            const left = 400 + pos.x - size / 2;
            const top = 400 + pos.y - size / 2;
            return (
              <div
                key={cluster.id}
                onClick={() => {
                  if (isFocused) {
                    setActiveCluster(null);
                    setActiveSubCluster(null);
                  } else {
                    setActiveCluster(cluster.id);
                    setActiveSubCluster(null);
                  }
                }}
                className="absolute cursor-pointer group"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${size}px`,
                  height: `${size}px`,
                  transition: "all 300ms cubic-bezier(0.32, 0.72, 0.35, 1.05)",
                  opacity: isDimmed ? 0.08 : 1,
                  filter: isDimmed ? "blur(4px)" : "none",
                }}
              >
                {isFocused && (
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(232, 165, 71, 0.2) 0%, transparent 70%)",
                      animation: "pulse-soft 2s ease-in-out infinite",
                    }}
                  />
                )}
                <div
                  className="absolute inset-0 rounded-full border transition-all"
                  style={{
                    background: "rgba(20, 22, 29, 0.85)",
                    backdropFilter: "blur(2px)",
                    borderColor: isFocused ? "#E8A547" : "rgba(156, 160, 172, 0.45)",
                    boxShadow: isFocused ? "0 0 16px rgba(232, 165, 71, 0.4)" : "none",
                  }}
                />
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ width: "4px", height: "4px", background: isFocused ? "#E8A547" : "#9CA0AC" }}
                />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 text-center whitespace-nowrap pointer-events-none">
                  <div
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: isFocused ? "#E8A547" : "#E8E9ED",
                      transition: "color 300ms",
                    }}
                  >
                    {cluster.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "10px",
                      color: "#3A3D47",
                      marginTop: "2px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {cluster.count}
                  </div>
                </div>
              </div>
            );
          })}

          {activeClusterData &&
            activeClusterData.subs.map((sub, idx) => {
              const pos = getSubClusterPos(idx, activeClusterData.subs.length, activeClusterData.angle);
              const isActive = activeSubCluster === sub.id;
              const size = 38;
              const left = 400 + pos.x - size / 2;
              const top = 400 + pos.y - size / 2;
              return (
                <div
                  key={sub.id}
                  onClick={() => setActiveSubCluster(isActive ? null : sub.id)}
                  className="absolute cursor-pointer"
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animation: "fade-up 400ms ease-out forwards",
                    opacity: 0,
                    transform: "translateY(20px)",
                    animationDelay: `${idx * 80}ms`,
                    transition: "all 300ms cubic-bezier(0.32, 0.72, 0.35, 1.05)",
                  }}
                >
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: "radial-gradient(circle, rgba(232, 165, 71, 0.2) 0%, transparent 70%)" }}
                    />
                  )}
                  <div
                    className="absolute inset-0 rounded-full border transition-all"
                    style={{
                      background: "rgba(20, 22, 29, 0.85)",
                      backdropFilter: "blur(2px)",
                      borderColor: isActive ? "#E8A547" : "rgba(156, 160, 172, 0.45)",
                      boxShadow: isActive ? "0 0 12px rgba(232, 165, 71, 0.4)" : "none",
                    }}
                  />
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ width: "3px", height: "3px", background: isActive ? "#E8A547" : "#9CA0AC" }}
                  />
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 text-center whitespace-nowrap pointer-events-none"
                    style={{
                      fontSize: "11px",
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 700,
                      color: isActive ? "#E8A547" : "#E8E9ED",
                      transition: "color 300ms",
                    }}
                  >
                    {sub.name}
                  </div>
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-10 text-center whitespace-nowrap pointer-events-none"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "9px",
                      color: "#3A3D47",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {sub.count}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Breadcrumb — centered within map area */}
      {activeCluster && (
        <div
          className="absolute bottom-6"
          style={{
            left: "calc((100% - 384px) / 2)",
            transform: "translateX(-50%)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "10px",
            color: "rgba(156, 160, 172, 0.7)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            zIndex: 20,
          }}
        >
          {activeClusterData?.name}
          {activeSubData && (
            <>
              <span className="mx-2">/</span>
              <span style={{ color: "#E8A547" }}>{activeSubData.name}</span>
            </>
          )}
        </div>
      )}

      {/* Persistent topic detail pane */}
      <div
        className="absolute right-0 top-0 bottom-0 w-96 bg-[#0A0B0F]/95 overflow-y-auto"
        style={{
          borderLeft: "1px solid rgba(232,165,71,0.2)",
          backdropFilter: "blur(12px)",
          zIndex: 25,
        }}
      >
        {activeCluster ? (
          <TopicDetailPane
            topic={activeSubData?.topic ?? activeClusterData?.topic}
            isSub={!!activeSubData}
            siblings={activeClusterData?.subs ?? []}
            onSelectSibling={(id) => setActiveSubCluster(id)}
            showSiblings={!activeSubData}
            onClear={() => {
              setActiveCluster(null);
              setActiveSubCluster(null);
            }}
          />
        ) : (
          <DrawerOverview
            clusters={clusters}
            onSelectCluster={(id) => {
              setActiveCluster(id);
              setActiveSubCluster(null);
            }}
          />
        )}
      </div>
    </>
  );
});

function DrawerOverview({
  clusters,
  onSelectCluster,
}: {
  clusters: Cluster[];
  onSelectCluster: (id: string) => void;
}) {
  const totalDocs = clusters.reduce((sum, c) => sum + c.count, 0);
  const totalSubs = clusters.reduce((sum, c) => sum + c.subs.length, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "10px",
            color: "rgba(156, 160, 172, 0.6)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Overview
        </div>
        <h2
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "20px",
            fontWeight: 700,
            color: "#E8A547",
            marginBottom: "8px",
            letterSpacing: "-0.01em",
          }}
        >
          Knowledge Map
        </h2>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 300, color: "#9CA0AC", lineHeight: 1.6 }}>
          {clusters.length} top-level topic{clusters.length === 1 ? "" : "s"} · {totalSubs} sub-topic{totalSubs === 1 ? "" : "s"} · {totalDocs.toLocaleString()} document{totalDocs === 1 ? "" : "s"}.
        </p>
      </div>

      <div>
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "10px",
            color: "rgba(156, 160, 172, 0.6)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Topics
        </div>
        <div className="space-y-1.5">
          {clusters.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCluster(c.id)}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded transition-all"
              style={{
                background: "transparent",
                border: "1px solid rgba(58,61,71,0.3)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,165,71,0.4)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,165,71,0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(58,61,71,0.3)";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#E8A547", boxShadow: "0 0 4px rgba(232,165,71,0.6)" }} />
              <span className="flex-1 truncate" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 400, color: "#E8E9ED" }}>
                {c.name}
              </span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#9CA0AC", letterSpacing: "0.05em" }}>
                {c.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#3A3D47", lineHeight: 1.55, fontStyle: "italic" }}>
        Click a node on the map (or a topic above) to see its summary, key themes, and suggested use cases.
      </p>
    </div>
  );
}

function TopicDetailPane({
  topic,
  isSub,
  siblings,
  onSelectSibling,
  showSiblings,
  onClear,
}: {
  topic: Topic | undefined;
  isSub: boolean;
  siblings: SubCluster[];
  onSelectSibling: (id: string) => void;
  showSiblings: boolean;
  onClear: () => void;
}) {
  if (!topic) return null;
  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "10px",
              color: "rgba(156, 160, 172, 0.6)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            {isSub ? "Sub-Topic" : "Topic"}
          </div>
          <button
            onClick={onClear}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "9px",
              letterSpacing: "0.15em",
              color: "#9CA0AC",
              textTransform: "uppercase",
            }}
            className="hover:text-[#E8A547] transition-colors"
          >
            ← Overview
          </button>
        </div>
        <h2
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "20px",
            fontWeight: 700,
            color: "#E8A547",
            marginBottom: "8px",
          }}
        >
          {topic.label}
        </h2>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "rgba(156, 160, 172, 0.7)" }}>
          {topic.doc_count} document{topic.doc_count === 1 ? "" : "s"}
        </div>
      </div>

      {topic.semantic_summary && (
        <PaneSection label="Summary">
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 300, color: "#E8E9ED", lineHeight: 1.6 }}>
            {topic.semantic_summary}
          </p>
        </PaneSection>
      )}

      {topic.key_themes && topic.key_themes.length > 0 && (
        <PaneSection label="Key Themes">
          <ChipList items={topic.key_themes} />
        </PaneSection>
      )}

      {topic.keywords && topic.keywords.length > 0 && (
        <PaneSection label="Keywords">
          <ChipList items={topic.keywords} subtle />
        </PaneSection>
      )}

      {topic.suggested_use_cases && topic.suggested_use_cases.length > 0 && (
        <PaneSection label="Suggested Use Cases">
          <ul className="space-y-2">
            {topic.suggested_use_cases.map((u, i) => (
              <li
                key={i}
                className="flex gap-2"
                style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC", lineHeight: 1.5 }}
              >
                <span style={{ color: "#E8A547" }}>·</span>
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </PaneSection>
      )}

      {showSiblings && siblings.length > 0 && (
        <PaneSection label="Sub-Topics">
          <div className="space-y-2">
            {siblings.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSibling(s.id)}
                className="w-full text-left p-3 rounded-lg transition-all"
                style={{
                  border: "1px solid rgba(232,165,71,0.2)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,165,71,0.5)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,165,71,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,165,71,0.2)";
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 600, color: "#E8E9ED", marginBottom: "4px" }}>
                  {s.name}
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "rgba(156, 160, 172, 0.6)" }}>
                  {s.count} document{s.count === 1 ? "" : "s"}
                </div>
              </button>
            ))}
          </div>
        </PaneSection>
      )}
    </div>
  );
}

function PaneSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "10px",
          color: "rgba(156, 160, 172, 0.6)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function ChipList({ items, subtle = false }: { items: string[]; subtle?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={i}
          className="px-2 py-1 rounded"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "10px",
            background: subtle ? "rgba(58,61,71,0.3)" : "rgba(232,165,71,0.08)",
            border: `1px solid ${subtle ? "rgba(58,61,71,0.5)" : "rgba(232,165,71,0.2)"}`,
            color: subtle ? "#9CA0AC" : "#E8A547",
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/* ── Stories view ──────────────────────────────────────────────────── */

const StoriesView = memo(function StoriesView({
  stories,
  topics,
  loading,
  error,
  onRetry,
}: {
  stories: Story[] | null;
  topics: Topic[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const topicLookup = useMemo(() => {
    const m = new Map<string, Topic>();
    for (const t of topics ?? []) m.set(t.topic_id, t);
    return m;
  }, [topics]);

  if (error) {
    return <CenteredMessage tone="error" message={`Couldn't load stories: ${error}`} actionLabel="Retry" onAction={onRetry} />;
  }
  if (loading && !stories) {
    return <CenteredMessage tone="muted" message="Loading stories…" />;
  }
  if (!stories || stories.length === 0) {
    return <CenteredMessage tone="muted" message="No stories yet. They appear once topics form coherent narrative threads." />;
  }

  const sorted = [...stories].sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0));

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-4">
        {sorted.map((story) => (
          <StoryCard key={story.story_id} story={story} topicLookup={topicLookup} />
        ))}
      </div>
    </div>
  );
});

function StoryCard({ story, topicLookup }: { story: Story; topicLookup: Map<string, Topic> }) {
  return (
    <article
      className="rounded-xl p-5"
      style={{ background: "rgba(58,61,71,0.12)", border: "1px solid rgba(58,61,71,0.4)" }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: "16px",
              fontWeight: 700,
              color: "#E8E9ED",
              letterSpacing: "-0.01em",
              marginBottom: "6px",
            }}
          >
            {story.title}
          </h3>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 300, color: "#9CA0AC", lineHeight: 1.6 }}>
            {story.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "9px",
              letterSpacing: "0.15em",
              color: "#9CA0AC",
              textTransform: "uppercase",
            }}
          >
            {story.doc_count} docs
          </span>
          {story.strength != null && (
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "9px",
                letterSpacing: "0.15em",
                color: "#E8A547",
                textTransform: "uppercase",
              }}
            >
              {Math.round(story.strength * 100)}%
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid rgba(58,61,71,0.3)" }}>
        {story.topic_sequence.map((id, i) => {
          const t = topicLookup.get(id);
          const label = t?.label ?? id;
          return (
            <span key={`${id}-${i}`} className="flex items-center gap-1.5">
              <span
                className="px-2 py-1 rounded"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "10px",
                  background: t ? "rgba(232,165,71,0.08)" : "rgba(58,61,71,0.3)",
                  border: `1px solid ${t ? "rgba(232,165,71,0.2)" : "rgba(58,61,71,0.5)"}`,
                  color: t ? "#E8A547" : "#9CA0AC",
                }}
              >
                {label}
              </span>
              {i < story.topic_sequence.length - 1 && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#3A3D47" strokeWidth="1.3">
                  <line x1="2" y1="5" x2="8" y2="5" />
                  <polyline points="5.5,2 8,5 5.5,8" />
                </svg>
              )}
            </span>
          );
        })}
      </div>

      {story.reasoning && (
        <p
          className="mt-3 pt-3"
          style={{
            borderTop: "1px solid rgba(58,61,71,0.3)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "12px",
            fontWeight: 300,
            color: "#9CA0AC",
            fontStyle: "italic",
            lineHeight: 1.55,
          }}
        >
          {story.reasoning}
        </p>
      )}
    </article>
  );
}

/* ── Centered messages ─────────────────────────────────────────────── */

function CenteredMessage({
  message,
  tone,
  actionLabel,
  onAction,
}: {
  message: string;
  tone: "error" | "muted";
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
            fontWeight: 300,
            color: tone === "error" ? "#C9534B" : "#9CA0AC",
            marginBottom: actionLabel ? "16px" : 0,
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 rounded transition-all hover:bg-[rgba(232,165,71,0.12)]"
            style={{
              border: "1px solid rgba(232,165,71,0.3)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "10px",
              letterSpacing: "0.15em",
              color: "#E8A547",
              textTransform: "uppercase",
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
