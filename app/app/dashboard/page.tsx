"use client";

import { useState, useRef, useEffect } from "react";
import { LeftRail } from "./LeftRail";

type Document = {
  id: string;
  title: string;
  date: string;
};

type SubCluster = {
  id: string;
  name: string;
  count: number;
  docs: Document[];
};

type Cluster = {
  id: string;
  name: string;
  count: number;
  angle: number;
  stale?: boolean;
  subs: SubCluster[];
};

const CLUSTERS: Cluster[] = [
  {
    id: "c1",
    name: "Customer Research",
    count: 47,
    angle: -90,
    subs: [
      { id: "s1-1", name: "User Interviews", count: 12, docs: [
        { id: "d1", title: "Q2 User Study", date: "2 days ago" },
        { id: "d2", title: "Interview Synthesis", date: "5 days ago" },
        { id: "d3", title: "User Personas", date: "1 week ago" },
      ]},
      { id: "s1-2", name: "Survey Data", count: 18, docs: [
        { id: "d4", title: "NPS Results", date: "3 days ago" },
        { id: "d5", title: "Survey Responses", date: "1 week ago" },
      ]},
      { id: "s1-3", name: "Feedback", count: 17, docs: [
        { id: "d6", title: "Customer Feedback Log", date: "2 days ago" },
      ]},
    ],
  },
  {
    id: "c2",
    name: "Product Specs",
    count: 62,
    angle: -30,
    subs: [
      { id: "s2-1", name: "Features", count: 24, docs: [{ id: "d7", title: "Feature Backlog", date: "1 week ago" }]},
      { id: "s2-2", name: "Requirements", count: 21, docs: [{ id: "d8", title: "PRD v2.1", date: "3 days ago" }]},
      { id: "s2-3", name: "Roadmap", count: 17, docs: [{ id: "d9", title: "Q3 Roadmap", date: "5 days ago" }]},
    ],
  },
  {
    id: "c3",
    name: "Engineering Docs",
    count: 89,
    angle: 30,
    subs: [
      { id: "s3-1", name: "API Design", count: 32, docs: [{ id: "d10", title: "API Spec v3", date: "2 days ago" }]},
      { id: "s3-2", name: "Architecture", count: 28, docs: [{ id: "d11", title: "System Design", date: "1 week ago" }]},
      { id: "s3-3", name: "Deployment", count: 29, docs: [{ id: "d12", title: "Deploy Guide", date: "2 weeks ago" }]},
    ],
  },
  {
    id: "c4",
    name: "Meeting Notes",
    count: 134,
    angle: 90,
    subs: [
      { id: "s4-1", name: "Planning", count: 45, docs: [{ id: "d13", title: "Sprint Planning", date: "3 days ago" }]},
      { id: "s4-2", name: "Reviews", count: 44, docs: [{ id: "d14", title: "Code Review Notes", date: "1 day ago" }]},
      { id: "s4-3", name: "Retrospectives", count: 45, docs: [{ id: "d15", title: "Retro Notes", date: "4 days ago" }]},
    ],
  },
  {
    id: "c5",
    name: "Sales Playbook",
    count: 31,
    angle: 150,
    stale: true,
    subs: [
      { id: "s5-1", name: "Pitch Deck", count: 10, docs: [{ id: "d16", title: "Pitch v4", date: "2 weeks ago" }]},
      { id: "s5-2", name: "Case Studies", count: 12, docs: [{ id: "d17", title: "Case Studies", date: "3 weeks ago" }]},
      { id: "s5-3", name: "Pricing", count: 9, docs: [{ id: "d18", title: "Pricing Guide", date: "1 month ago" }]},
    ],
  },
  {
    id: "c6",
    name: "Design System",
    count: 28,
    angle: -150,
    subs: [
      { id: "s6-1", name: "Components", count: 10, docs: [{ id: "d19", title: "Component Library", date: "1 week ago" }]},
      { id: "s6-2", name: "Patterns", count: 9, docs: [{ id: "d20", title: "UI Patterns", date: "1 week ago" }]},
      { id: "s6-3", name: "Guidelines", count: 9, docs: [{ id: "d21", title: "Design Guidelines", date: "2 weeks ago" }]},
    ],
  },
];

const RADIUS = 240;
const SUB_RADIUS = 130;

function getClusterPos(angle: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: Math.cos(rad) * RADIUS,
    y: Math.sin(rad) * RADIUS,
  };
}

function getSubClusterPos(index: number, total: number, baseAngle: number) {
  const angle =
    (index / total) * Math.PI * 2 - Math.PI / 2 + (baseAngle * Math.PI) / 180;
  return {
    x: Math.cos(angle) * SUB_RADIUS,
    y: Math.sin(angle) * SUB_RADIUS,
  };
}

function getSpatialNeighbor(
  currentId: string | null,
  clusters: Cluster[],
  direction: "up" | "down" | "left" | "right"
): string {
  if (!currentId) return clusters[0].id;

  const current = clusters.find((c) => c.id === currentId);
  if (!current) return clusters[0].id;

  const directionAngles: Record<string, number> = {
    up: -90,
    right: 0,
    down: 90,
    left: 180,
  };

  const targetAngle = directionAngles[direction];
  const currentAngle = current.angle;
  const angleDiff = ((targetAngle - currentAngle + 540) % 360) - 180;

  let best = clusters[0];
  let bestDiff = Math.abs(((best.angle - currentAngle + 540) % 360) - 180);

  for (const cluster of clusters) {
    if (cluster.id === currentId) continue;
    const diff = Math.abs(((cluster.angle - currentAngle + 540) % 360) - 180);
    if (diff < bestDiff && diff < 120) {
      best = cluster;
      bestDiff = diff;
    }
  }

  return best.id;
}

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
    }> = [];

    const createParticle = () => {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.36,
        vy: (Math.random() - 0.5) * 0.36,
        life: Math.random() * 0.5 + 0.5,
      });
    };

    Array.from({ length: 40 }).forEach(() => createParticle());

    const animate = () => {
      ctx.fillStyle = "rgba(10, 11, 15, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.004;

        if (p.life <= 0) {
          particles.splice(i, 1);
          createParticle();
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

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}

export default function DashboardPage() {
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [activeSubCluster, setActiveSubCluster] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const mapRef = useRef<HTMLDivElement>(null);

  const activeClusterData = CLUSTERS.find((c) => c.id === activeCluster);
  const activeSubData = activeClusterData?.subs.find(
    (s) => s.id === activeSubCluster
  );

  const isZoomed = activeCluster !== null;
  const isSubZoomed = activeSubCluster !== null;
  const activePos = activeCluster
    ? getClusterPos(CLUSTERS.find((c) => c.id === activeCluster)!.angle)
    : null;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (activeSubCluster) {
        setActiveSubCluster(null);
      } else if (activeCluster) {
        setActiveCluster(null);
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (!activeCluster) {
        setActiveCluster(CLUSTERS[0].id);
      } else if (!activeSubCluster && activeClusterData?.subs[0]) {
        setActiveSubCluster(activeClusterData.subs[0].id);
      }
      return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      const isNext = e.key === "ArrowRight" || e.key === "ArrowDown";

      // Navigating sub-clusters
      if (activeSubCluster) {
        const subs = activeClusterData?.subs || [];
        const currentIdx = subs.findIndex((s) => s.id === activeSubCluster);
        const nextIdx = isNext
          ? (currentIdx + 1) % subs.length
          : (currentIdx - 1 + subs.length) % subs.length;
        setActiveSubCluster(subs[nextIdx].id);
        return;
      }

      // No cluster selected — select first
      if (!activeCluster) {
        setActiveCluster(CLUSTERS[0].id);
        return;
      }

      // Navigating clusters (cyclical)
      const currentIdx = CLUSTERS.findIndex((c) => c.id === activeCluster);
      const nextIdx = isNext
        ? (currentIdx + 1) % CLUSTERS.length
        : (currentIdx - 1 + CLUSTERS.length) % CLUSTERS.length;
      setActiveCluster(CLUSTERS[nextIdx].id);
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    setZoomLevel((prev) => {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = prev * delta;
      return Math.max(0.5, Math.min(3, newZoom));
    });
  };

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    mapElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => mapElement.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCluster, activeSubCluster]);

  return (
    <div className="min-h-screen bg-[#0A0B0F] overflow-hidden relative">
      <Particles />

      {/* Vignette + Starfield */}
      <div
        className="fixed inset-0 z-[5] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(20,22,29,0) 0%, rgba(6,7,10,0.8) 100%)",
        }}
      />

      {/* Stars */}
      <div className="fixed inset-0 z-[5] pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 h-screen flex flex-col items-center justify-center">
        {/* Left Rail */}
        <LeftRail />

        {/* Key Hint Bar */}
        <div
          className="fixed top-8 left-1/2 -translate-x-1/2 z-20 flex gap-4 items-center"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "10px",
            color: "rgba(156, 160, 172, 0.55)",
            letterSpacing: "0.12em",
          }}
        >
          {[
            { keys: "↑ ↓ ← →", label: "NAVIGATE" },
            { keys: "⏎", label: isSubZoomed ? "OPEN" : "ZOOM" },
            { keys: "⎋", label: "EXIT" },
            { keys: "[", label: "RAIL" },
            { keys: "?", label: "HELP" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="px-2 py-1 border border-[rgba(156,160,172,0.3)]"
                style={{
                  fontSize: "9px",
                  background: "rgba(20, 22, 29, 0.5)",
                  borderRadius: "3px",
                }}
              >
                {item.keys}
              </div>
              <span className="text-[9px]">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Step Indicator */}
        <div
          className="fixed top-8 right-8 z-20"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "10px",
            color: "rgba(156, 160, 172, 0.55)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {isSubZoomed ? "DETAIL · 02/03" : isZoomed ? "ZOOMED · 01/03" : "OVERVIEW"}
        </div>

        {/* Map Stage */}
        <div
          ref={mapRef}
          className="relative"
          style={{
            width: "800px",
            height: "800px",
            perspective: "1000px",
            transform: `scale(${zoomLevel})`,
            transition: "transform 100ms ease-out",
            transformOrigin: "center",
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 800 800"
            style={{
              transform: isZoomed
                ? `translate(${-activePos!.x * 1.2}px, ${-activePos!.y * 1.2}px) scale(${isSubZoomed ? 2.1 : 1.45})`
                : "translate(0, 0) scale(1)",
              transition: "transform 400ms cubic-bezier(0.32, 0.72, 0.35, 1.05)",
            }}
          >
            {/* Dashed radial lines */}
            {CLUSTERS.map((cluster) => {
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

            {/* Adjacent cluster arcs */}
            {CLUSTERS.map((cluster, i) => {
              const nextCluster = CLUSTERS[(i + 1) % CLUSTERS.length];
              const pos1 = getClusterPos(cluster.angle);
              const pos2 = getClusterPos(nextCluster.angle);
              return (
                <line
                  key={`arc-${cluster.id}`}
                  x1={400 + pos1.x}
                  y1={400 + pos1.y}
                  x2={400 + pos2.x}
                  y2={400 + pos2.y}
                  stroke="rgba(58, 61, 71, 0.25)"
                  strokeWidth="0.5"
                />
              );
            })}

            {/* Center beacon */}
            <circle
              cx="400"
              cy="400"
              r="14"
              fill="#E8A547"
              style={{
                filter: "drop-shadow(0 0 24px #E8A547)",
                animation: "pulse-soft 2s ease-in-out infinite",
              }}
            />
          </svg>

          {/* Cluster nodes */}
          {CLUSTERS.map((cluster) => {
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
                  transition:
                    "all 300ms cubic-bezier(0.32, 0.72, 0.35, 1.05)",
                  opacity: isDimmed ? 0.08 : 1,
                  filter: isDimmed ? "blur(4px)" : "none",
                }}
              >
                {isFocused && (
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle, rgba(232, 165, 71, 0.2) 0%, transparent 70%)`,
                      animation: "pulse-soft 2s ease-in-out infinite",
                    }}
                  />
                )}

                <div
                  className="absolute inset-0 rounded-full border transition-all"
                  style={{
                    background: "rgba(20, 22, 29, 0.85)",
                    backdropFilter: "blur(2px)",
                    borderWidth: isFocused ? "1px" : "1px",
                    borderColor: isFocused ? "#E8A547" : "rgba(156, 160, 172, 0.45)",
                    boxShadow: isFocused ? `0 0 16px rgba(232, 165, 71, 0.4)` : "none",
                  }}
                />

                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: "4px",
                    height: "4px",
                    background: cluster.stale
                      ? "#C99547"
                      : isFocused
                        ? "#E8A547"
                        : "#9CA0AC",
                  }}
                />

                {isFocused && (
                  <>
                    {[
                      { top: "-8px", left: "-8px", style: "border-l-2 border-t-2" },
                      { top: "-8px", right: "-8px", style: "border-r-2 border-t-2" },
                      { bottom: "-8px", left: "-8px", style: "border-l-2 border-b-2" },
                      { bottom: "-8px", right: "-8px", style: "border-r-2 border-b-2" },
                    ].map((bracket, i) => (
                      <div
                        key={i}
                        className="absolute w-3 h-3"
                        style={{
                          ...bracket,
                          borderColor: "#E8A547",
                          ...(bracket.style.includes("border-l")
                            ? { borderLeft: "1px solid #E8A547" }
                            : {}),
                          ...(bracket.style.includes("border-r")
                            ? { borderRight: "1px solid #E8A547" }
                            : {}),
                          ...(bracket.style.includes("border-t")
                            ? { borderTop: "1px solid #E8A547" }
                            : {}),
                          ...(bracket.style.includes("border-b")
                            ? { borderBottom: "1px solid #E8A547" }
                            : {}),
                        }}
                      />
                    ))}
                  </>
                )}

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

          {/* Sub-cluster nodes */}
          {activeClusterData &&
            activeClusterData.subs.map((sub, idx) => {
              const pos = getSubClusterPos(
                idx,
                activeClusterData.subs.length,
                activeClusterData.angle
              );
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
                      style={{
                        background: `radial-gradient(circle, rgba(232, 165, 71, 0.2) 0%, transparent 70%)`,
                      }}
                    />
                  )}

                  <div
                    className="absolute inset-0 rounded-full border transition-all"
                    style={{
                      background: "rgba(20, 22, 29, 0.85)",
                      backdropFilter: "blur(2px)",
                      borderWidth: isActive ? "1px" : "1px",
                      borderColor: isActive ? "#E8A547" : "rgba(156, 160, 172, 0.45)",
                      boxShadow: isActive ? `0 0 12px rgba(232, 165, 71, 0.4)` : "none",
                    }}
                  />

                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      width: "3px",
                      height: "3px",
                      background: isActive ? "#E8A547" : "#9CA0AC",
                    }}
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

        {/* Breadcrumb */}
        {activeCluster && (
          <div
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-20"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "10px",
              color: "rgba(156, 160, 172, 0.7)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
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
      </div>

      {/* Document Pane */}
      {activeCluster && (
        <div
          className="fixed right-0 top-0 bottom-0 w-96 bg-[#0A0B0F]/95 border-l border-[rgba(232,165,71,0.2)] overflow-y-auto z-20"
          style={{
            backdropFilter: "blur(12px)",
            animation: "slide-in-left 300ms ease-out",
          }}
        >
          <div className="p-6 space-y-6">
            {/* Header */}
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
                {activeSubData ? "Sub-Cluster" : "Cluster"}
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
                {activeSubData?.name || activeClusterData?.name}
              </h2>
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "12px",
                  color: "rgba(156, 160, 172, 0.7)",
                }}
              >
                {activeSubData?.count || activeClusterData?.count} documents
              </div>
            </div>

            {/* Documents List */}
            {activeSubData && (
              <div className="space-y-2">
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
                  Documents
                </div>
                <div className="space-y-2">
                  {activeSubData.docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg border border-[rgba(232,165,71,0.2)] hover:border-[rgba(232,165,71,0.5)] hover:bg-[rgba(232,165,71,0.05)] transition-all cursor-pointer"
                    >
                      <div
                        style={{
                          fontFamily: "Syne, sans-serif",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#E8E9ED",
                          marginBottom: "4px",
                        }}
                      >
                        {doc.title}
                      </div>
                      <div
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "9px",
                          color: "rgba(156, 160, 172, 0.6)",
                        }}
                      >
                        {doc.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-clusters when cluster is selected but not sub */}
            {activeCluster && !activeSubData && (
              <div className="space-y-2">
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
                  Sub-Clusters
                </div>
                <div className="space-y-2">
                  {activeClusterData?.subs.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubCluster(sub.id)}
                      className="w-full text-left p-3 rounded-lg border border-[rgba(232,165,71,0.2)] hover:border-[rgba(232,165,71,0.5)] hover:bg-[rgba(232,165,71,0.05)] transition-all"
                    >
                      <div
                        style={{
                          fontFamily: "Syne, sans-serif",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#E8E9ED",
                          marginBottom: "4px",
                        }}
                      >
                        {sub.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "9px",
                          color: "rgba(156, 160, 172, 0.6)",
                        }}
                      >
                        {sub.count} documents
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
