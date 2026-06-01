"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SourcesModal, type DriveConnection } from "./SourcesModal";
import { useClusteringStatus } from "../hooks/useClusteringStatus";
import { authedFetch } from "@/utils/authedFetch";

type Source = {
  id: string;
  name: string;
  count: number | "SOON";
  active: boolean;
};

export function LeftRail() {
  const clustering = useClusteringStatus();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [connections, setConnections] = useState<DriveConnection[]>([]);
  const [connectToast, setConnectToast] = useState<"connected" | "denied" | "error" | null>(null);
  const [toastDocs, setToastDocs] = useState<number>(0);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await authedFetch("/api/drive/status");
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections ?? []);
      }
    } catch {
      // Network error — keep current state
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("poysis-rail-collapsed");
    if (stored === "true") setCollapsed(true);
    setMounted(true);

    // Check for post-OAuth redirect result in URL params
    const params = new URLSearchParams(window.location.search);
    const driveParam = params.get("drive");
    if (driveParam) {
      if (driveParam === "connected") {
        setConnectToast("connected");
        setToastDocs(parseInt(params.get("docs") ?? "0", 10));
      } else if (driveParam === "denied") setConnectToast("denied");
      else setConnectToast("error");

      // Remove the query param without a page reload
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);

      // Auto-dismiss after 4s
      setTimeout(() => setConnectToast(null), 4000);
    }

    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("poysis-rail-collapsed", String(collapsed));
    }
  }, [collapsed, mounted]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "[") {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Build Source[] display rows from live connections
  const sources: Source[] = [
    ...connections.map((c) => ({
      id: c.id,
      name: c.google_account_email,
      count: c.doc_count,
      active: true,
    })),
    ...(connections.length === 0
      ? [{ id: "gdrive-empty", name: "Google Drive", count: 0 as number, active: false }]
      : []),
    { id: "notion", name: "Notion", count: "SOON" as const, active: false },
    { id: "slack", name: "Slack", count: "SOON" as const, active: false },
    { id: "confluence", name: "Confluence", count: "SOON" as const, active: false },
  ];

  const totalDocs = connections.reduce((sum, c) => sum + (c.doc_count ?? 0), 0);
  const activeSourceCount = connections.length;

  return (
    <div
      className="absolute top-0 left-0 bottom-0 z-30 flex flex-col"
      style={{
        width: collapsed ? "56px" : "280px",
        background: collapsed ? "rgba(10,11,15,0.6)" : "rgba(10,11,15,0.94)",
        borderRight: "1px solid rgba(58,61,71,0.4)",
        backdropFilter: "blur(16px)",
        transition: "width 280ms cubic-bezier(0.32, 0.72, 0.35, 1.05), background 200ms ease-out",
      }}
    >
      {/* Toast */}
      {connectToast && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg"
          style={{
            background: connectToast === "connected" ? "rgba(107,176,122,0.15)" : "rgba(201,83,75,0.15)",
            border: `1px solid ${connectToast === "connected" ? "rgba(107,176,122,0.4)" : "rgba(201,83,75,0.4)"}`,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "9px",
            letterSpacing: "0.12em",
            color: connectToast === "connected" ? "#6BB07A" : "#C9534B",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {connectToast === "connected" && `✓ Drive connected${toastDocs > 0 ? ` · ${toastDocs.toLocaleString()} docs` : ""}`}
          {connectToast === "denied" && "Drive connection cancelled"}
          {connectToast === "error" && "Drive connection failed"}
        </div>
      )}

      {collapsed ? (
        <CollapsedRail onExpand={() => setCollapsed(false)} />
      ) : (
        <ExpandedRail
          sources={sources}
          activeSourceCount={activeSourceCount}
          totalDocs={totalDocs}
          onCollapse={() => setCollapsed(true)}
          onManageSources={() => setSourcesOpen(true)}
        />
      )}

      {sourcesOpen && (
        <SourcesModal
          connections={connections}
          onConnectionChange={fetchConnections}
          onClose={() => setSourcesOpen(false)}
          clustering={clustering}
        />
      )}
    </div>
  );
}

function CollapsedRail({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="flex flex-col items-center pt-6 gap-4">
      <button onClick={onExpand} className="w-8 h-8 flex items-center justify-center" title="Expand rail ( [ )">
        <div className="w-2 h-2 rounded-full bg-[#E8A547]" style={{ boxShadow: "0 0 8px rgba(232, 165, 71, 0.6)" }} />
      </button>
      <button onClick={onExpand} className="w-8 h-8 rounded flex items-center justify-center hover:bg-[rgba(232,165,71,0.08)] transition-colors" title="Sources">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" strokeWidth="1.3" stroke="#9CA0AC">
          <ellipse cx="8" cy="4" rx="5" ry="2" />
          <path d="M3 4v4c0 1.1 2.24 2 5 2s5-.9 5-2V4" />
          <path d="M3 8v4c0 1.1 2.24 2 5 2s5-.9 5-2V8" />
        </svg>
      </button>
      <Link href="/query" className="w-8 h-8 rounded flex items-center justify-center hover:bg-[rgba(232,165,71,0.08)] transition-colors" title="Query integrations">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" strokeWidth="1.3" stroke="#9CA0AC">
          <circle cx="7" cy="7" r="4.5" /><line x1="10.5" y1="10.5" x2="14" y2="14" />
        </svg>
      </Link>
      <Link href="/workspace" className="w-8 h-8 rounded flex items-center justify-center hover:bg-[rgba(232,165,71,0.08)] transition-colors" title="Playground">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" strokeWidth="1.3" stroke="#9CA0AC">
          <rect x="1" y="5" width="5.5" height="10" rx="1" /><rect x="9" y="1" width="5.5" height="14" rx="1" />
        </svg>
      </Link>
    </div>
  );
}

function ExpandedRail({
  sources,
  activeSourceCount,
  totalDocs,
  onCollapse,
  onManageSources,
}: {
  sources: Source[];
  activeSourceCount: number;
  totalDocs: number;
  onCollapse: () => void;
  onManageSources: () => void;
}) {
  return (
    <>
      {/* Wordmark + Toggle */}
      <div className="flex items-center justify-between px-5 pt-6 pb-6">
        <div className="flex items-baseline gap-1.5" style={{ fontFamily: "Syne, sans-serif", fontSize: "18px", fontWeight: 800, letterSpacing: "-0.04em", color: "#E8E9ED" }}>
          Poysis
          <div className="w-1.5 h-1.5 bg-[#E8A547] rounded-full" style={{ transform: "translateY(-7px)", boxShadow: "0 0 8px rgba(232, 165, 71, 0.6)" }} />
        </div>
        <button onClick={onCollapse} className="w-3.5 h-3.5 flex items-center justify-center text-[#9CA0AC] hover:text-[#E8E9ED] transition-colors" title="Collapse rail ( [ )">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" strokeWidth="1.4" stroke="currentColor">
            <polyline points="8,3 4,7 8,11" />
          </svg>
        </button>
      </div>

      <div className="flex-1 px-5 pb-5 space-y-6" style={{ overflowY: "auto", scrollbarWidth: "none" } as React.CSSProperties}>
        {/* State Card */}
        <div className="pl-3" style={{ borderLeft: "2px solid #6BB07A" }}>
          <div className="flex gap-6 mb-2">
            <div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "20px", fontWeight: 500, color: "#E8E9ED" }}>
                {totalDocs > 0 ? totalDocs.toLocaleString() : "—"}
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#9CA0AC", textTransform: "uppercase", marginTop: "2px" }}>
                Docs
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "20px", fontWeight: 500, color: "#E8E9ED" }}>
                {activeSourceCount > 0 ? activeSourceCount : "—"}
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#9CA0AC", textTransform: "uppercase", marginTop: "2px" }}>
                Sources
              </div>
            </div>
          </div>

          <svg width="100%" height="16" viewBox="0 0 200 16" preserveAspectRatio="none" className="my-2">
            <polyline
              points="0,12 15,8 30,10 45,5 60,7 75,4 90,8 105,6 120,9 135,5 150,7 165,3 180,6 200,4"
              fill="none"
              stroke="#6BB07A"
              strokeWidth="1"
              opacity="0.5"
            />
          </svg>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: activeSourceCount > 0 ? "#6BB07A" : "#3A3D47",
                  boxShadow: activeSourceCount > 0 ? "0 0 5px rgba(107,176,122,0.6)" : "none",
                }}
              />
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#9CA0AC", textTransform: "uppercase" }}>
                {activeSourceCount > 0 ? "Healthy" : "No sources"}
              </span>
            </div>
            {activeSourceCount > 0 && (
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#9CA0AC", textTransform: "uppercase" }}>
                Live
              </span>
            )}
          </div>
        </div>

        {/* Sources */}
        <div>
          <Eyebrow label={`Sources · ${activeSourceCount}`} action="Manage" onAction={onManageSources} />
          <div className="space-y-1 mb-3">
            {sources.map((source) => (
              <RailRow
                key={source.id}
                label={source.name}
                count={source.count === "SOON" ? "Soon" : source.count > 0 ? String(source.count) : "—"}
                dotColor={source.active ? "#6BB07A" : "#3A3D47"}
                filled={source.active}
                dimmed={!source.active}
              />
            ))}
          </div>
          <button
            onClick={onManageSources}
            className="w-full py-2 px-3 rounded transition-colors hover:bg-[rgba(232,165,71,0.05)]"
            style={{ border: "1px dashed rgba(232, 165, 71, 0.35)", fontFamily: "JetBrains Mono, monospace", fontSize: "10px", letterSpacing: "0.15em", color: "#E8A547", textTransform: "uppercase" }}
          >
            + Connect New Source
          </button>
        </div>

        {/* Query */}
        <div>
          <Eyebrow label="Query" action="Manage" onAction={() => {}} linkHref="/query" />
          <Link href="/query" className="flex items-center gap-2 px-2 py-1.5 rounded transition-colors hover:bg-[rgba(232,165,71,0.05)]" style={{ textDecoration: "none" }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#6BB07A]" style={{ boxShadow: "0 0 5px rgba(107,176,122,0.6)" }} />
            <span className="flex-1" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC" }}>Claude</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#6BB07A", textTransform: "uppercase" }}>Active</span>
          </Link>
        </div>
      </div>

      {/* Playground nav */}
      <div className="px-5 pb-4">
        <Link href="/workspace" className="flex items-center gap-2.5 px-3 py-2 rounded transition-colors hover:bg-[rgba(232,165,71,0.06)]" style={{ textDecoration: "none" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#9CA0AC" strokeWidth="1.3">
            <rect x="1" y="4" width="5" height="9" rx="1" /><rect x="8" y="1" width="5" height="12" rx="1" />
          </svg>
          <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC", flex: 1 }}>Playground</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#3A3D47" strokeWidth="1.3">
            <line x1="2" y1="5" x2="8" y2="5" /><polyline points="5.5,2 8,5 5.5,8" />
          </svg>
        </Link>
      </div>

      {/* Account Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(58,61,71,0.4)" }}>
        <button className="w-full flex items-center gap-3 hover:bg-[rgba(232,165,71,0.05)] rounded transition-colors p-1 -m-1">
          <div
            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #E8A547 0%, #C99547 100%)", fontFamily: "JetBrains Mono, monospace", fontSize: "11px", fontWeight: 500, color: "#0A0B0F" }}
          >
            m
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 400, color: "#E8E9ED" }}>maya.k</div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#9CA0AC", textTransform: "uppercase", marginTop: "1px" }}>Wks · Maven</div>
          </div>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#9CA0AC" strokeWidth="1.4">
            <polyline points="3,4 5,6 7,4" />
          </svg>
        </button>
      </div>
    </>
  );
}

function Eyebrow({ label, action, onAction, linkHref }: { label: string; action?: string; onAction?: () => void; linkHref?: string }) {
  return (
    <div className="flex items-center justify-between mb-2 px-2">
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#9CA0AC", textTransform: "uppercase" }}>
        {label}
      </span>
      {action && (
        linkHref ? (
          <Link href={linkHref} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#E8A547", textTransform: "uppercase", textDecoration: "none" }} className="hover:text-[#F5B25F] transition-colors">
            {action} →
          </Link>
        ) : (
          <button onClick={onAction} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#E8A547", textTransform: "uppercase" }} className="hover:text-[#F5B25F] transition-colors">
            {action} →
          </button>
        )
      )}
    </div>
  );
}

function RailRow({ label, count, dotColor, filled = true, dimmed = false }: { label: string; count: string; dotColor: string; filled?: boolean; dimmed?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[rgba(232,165,71,0.05)] transition-colors cursor-pointer" style={{ opacity: dimmed ? 0.45 : 1 }}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: filled ? dotColor : "transparent", border: filled ? "none" : `1px solid ${dotColor}` }} />
      <span className="flex-1 truncate" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC" }}>{label}</span>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#9CA0AC", flexShrink: 0 }}>{count}</span>
    </div>
  );
}
