"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConsolidation } from "./ConsolidationContext";

const NAV: { id: string; href: string; label: string; exact: boolean; modal?: boolean; icon: (active: boolean) => React.ReactElement }[] = [
  {
    id: "knowledge",
    href: "/workspace",
    label: "Knowledge",
    exact: true,
    icon: (active: boolean) => (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" strokeWidth="1.3" stroke={active ? "#E8A547" : "#9CA0AC"}>
        <circle cx="7" cy="7" r="2" />
        <circle cx="7" cy="2" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="9" r="1" />
        <circle cx="7" cy="12" r="1" />
        <circle cx="2" cy="9" r="1" />
        <circle cx="2" cy="5" r="1" />
        <line x1="7" y1="5" x2="7" y2="3" />
        <line x1="7" y1="9" x2="7" y2="11" />
        <line x1="8.7" y1="6" x2="11" y2="5.3" />
        <line x1="8.7" y1="8" x2="11" y2="8.7" />
        <line x1="5.3" y1="6" x2="3" y2="5.3" />
        <line x1="5.3" y1="8" x2="3" y2="8.7" />
      </svg>
    ),
  },
  {
    id: "visualize",
    href: "/workspace/visualize",
    label: "Visualize Knowledge",
    exact: false,
    icon: (active: boolean) => (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" strokeWidth="1.3" stroke={active ? "#E8A547" : "#9CA0AC"}>
        <circle cx="7" cy="7" r="1.4" fill={active ? "#E8A547" : "none"} />
        <circle cx="2.5" cy="3" r="1.1" />
        <circle cx="11.5" cy="3" r="1.1" />
        <circle cx="2.5" cy="11" r="1.1" />
        <circle cx="11.5" cy="11" r="1.1" />
        <line x1="3.4" y1="3.7" x2="6" y2="6.2" />
        <line x1="10.6" y1="3.7" x2="8" y2="6.2" />
        <line x1="3.4" y1="10.3" x2="6" y2="7.8" />
        <line x1="10.6" y1="10.3" x2="8" y2="7.8" />
      </svg>
    ),
  },
  {
    id: "sources",
    href: "/workspace/sources",
    label: "Sources",
    exact: false,
    modal: true,
    icon: (active: boolean) => (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" strokeWidth="1.3" stroke={active ? "#E8A547" : "#9CA0AC"}>
        <ellipse cx="8" cy="4" rx="5" ry="2" />
        <path d="M3 4v4c0 1.1 2.24 2 5 2s5-.9 5-2V4" />
        <path d="M3 8v4c0 1.1 2.24 2 5 2s5-.9 5-2V8" />
      </svg>
    ),
  },
  {
    id: "integrations",
    href: "/workspace/integrations",
    label: "Integrations",
    exact: false,
    icon: (active: boolean) => (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" strokeWidth="1.3" stroke={active ? "#E8A547" : "#9CA0AC"}>
        <circle cx="7" cy="7" r="2" />
        <line x1="7" y1="1" x2="7" y2="5" />
        <line x1="7" y1="9" x2="7" y2="13" />
        <line x1="1" y1="7" x2="5" y2="7" />
        <line x1="9" y1="7" x2="13" y2="7" />
      </svg>
    ),
  },
  {
    id: "playgrounds",
    href: "/workspace/playgrounds",
    label: "Playgrounds",
    exact: false,
    icon: (active: boolean) => (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" strokeWidth="1.3" stroke={active ? "#E8A547" : "#9CA0AC"}>
        <rect x="1" y="4" width="5" height="9" rx="1" />
        <rect x="8" y="1" width="5" height="12" rx="1" />
      </svg>
    ),
  },
];

export function WorkspaceSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const { start: startConsolidation, connections, openSources } = useConsolidation();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [connectToast, setConnectToast] = useState<"connected" | "denied" | "error" | null>(null);
  const [toastDocs, setToastDocs] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("poysis-rail-collapsed");
    if (stored === "true") setCollapsed(true);
    setMounted(true);

    const params = new URLSearchParams(window.location.search);
    const driveParam = params.get("drive");
    if (driveParam) {
      if (driveParam === "connected") {
        setConnectToast("connected");
        setToastDocs(parseInt(params.get("docs") ?? "0", 10));
        startConsolidation();
      } else if (driveParam === "denied") {
        setConnectToast("denied");
      } else {
        setConnectToast("error");
      }
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setConnectToast(null), 4000);
    }
  }, [startConsolidation]);

  useEffect(() => {
    if (mounted) localStorage.setItem("poysis-rail-collapsed", String(collapsed));
  }, [collapsed, mounted]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "[") { e.preventDefault(); setCollapsed((p) => !p); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const totalDocs = connections.reduce((sum, c) => sum + (c.doc_count ?? 0), 0);
  const activeSourceCount = connections.length;
  const initials = email ? email[0].toUpperCase() : "?";

  return (
    <div
      className="relative flex flex-col flex-shrink-0"
      style={{
        width: collapsed ? "56px" : "260px",
        height: "100vh",
        background: "rgba(10,11,15,0.98)",
        borderRight: "1px solid rgba(58,61,71,0.4)",
        transition: "width 280ms cubic-bezier(0.32, 0.72, 0.35, 1.05)",
        overflow: "hidden",
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
            textTransform: "uppercase" as const,
            whiteSpace: "nowrap" as const,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {connectToast === "connected" && `✓ Drive connected${toastDocs > 0 ? ` · ${toastDocs.toLocaleString()} docs` : ""}`}
          {connectToast === "denied" && "Drive connection cancelled"}
          {connectToast === "error" && "Drive connection failed"}
        </div>
      )}

      {collapsed ? (
        <div className="flex flex-col items-center pt-6 gap-3">
          <button
            onClick={() => setCollapsed(false)}
            className="w-8 h-8 flex items-center justify-center"
            title="Expand ( [ )"
          >
            <div
              className="w-2 h-2 rounded-full bg-[#E8A547]"
              style={{ boxShadow: "0 0 8px rgba(232,165,71,0.6)" }}
            />
          </button>
          {NAV.map(({ id, href, label, icon, exact, modal }) => {
            const active = modal ? false : exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
            if (modal) {
              return (
                <button
                  key={id}
                  onClick={openSources}
                  className="w-8 h-8 rounded flex items-center justify-center transition-colors"
                  style={{ background: "transparent" }}
                  title={label}
                >
                  {icon(false)}
                </button>
              );
            }
            return (
              <Link
                key={id}
                href={href}
                className="w-8 h-8 rounded flex items-center justify-center transition-colors"
                style={{ background: active ? "rgba(232,165,71,0.1)" : "transparent" }}
                title={label}
              >
                {icon(active)}
              </Link>
            );
          })}
        </div>
      ) : (
        <>
          {/* Wordmark */}
          <div className="flex items-center justify-between px-5 pt-6 pb-5">
            <div
              className="flex items-baseline gap-1.5"
              style={{ fontFamily: "Syne, sans-serif", fontSize: "18px", fontWeight: 800, letterSpacing: "-0.04em", color: "#E8E9ED" }}
            >
              Poysis
              <div
                className="w-1.5 h-1.5 bg-[#E8A547] rounded-full"
                style={{ transform: "translateY(-7px)", boxShadow: "0 0 8px rgba(232,165,71,0.6)" }}
              />
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="w-3.5 h-3.5 flex items-center justify-center text-[#9CA0AC] hover:text-[#E8E9ED] transition-colors"
              title="Collapse ( [ )"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" strokeWidth="1.4" stroke="currentColor">
                <polyline points="8,3 4,7 8,11" />
              </svg>
            </button>
          </div>

          <div
            className="flex-1 px-4 pb-4"
            style={{ overflowY: "auto", scrollbarWidth: "none" } as React.CSSProperties}
          >
            {/* State card */}
            <div className="mb-5 pl-3" style={{ borderLeft: "2px solid #6BB07A" }}>
              <div className="flex gap-6 mb-2">
                <div>
                  <div
                    style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "20px", fontWeight: 500, color: "#E8E9ED" }}
                  >
                    {totalDocs > 0 ? totalDocs.toLocaleString() : "—"}
                  </div>
                  <div
                    style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#9CA0AC", textTransform: "uppercase" as const, marginTop: "2px" }}
                  >
                    Docs
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "20px", fontWeight: 500, color: "#E8E9ED" }}
                  >
                    {activeSourceCount > 0 ? activeSourceCount : "—"}
                  </div>
                  <div
                    style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#9CA0AC", textTransform: "uppercase" as const, marginTop: "2px" }}
                  >
                    Sources
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: activeSourceCount > 0 ? "#6BB07A" : "#3A3D47",
                    boxShadow: activeSourceCount > 0 ? "0 0 5px rgba(107,176,122,0.6)" : "none",
                  }}
                />
                <span
                  style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#9CA0AC", textTransform: "uppercase" as const }}
                >
                  {activeSourceCount > 0 ? "Healthy" : "No sources"}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div style={{ borderTop: "1px solid rgba(58,61,71,0.3)", paddingTop: "16px" }}>
              <div
                style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#3A3D47", textTransform: "uppercase" as const, marginBottom: "6px", paddingLeft: "8px" }}
              >
                Workspace
              </div>
              <nav className="space-y-0.5">
                {NAV.map(({ id, href, label, icon, exact, modal }) => {
                  const active = modal ? false : exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
                  const sharedStyle = {
                    background: active ? "rgba(232,165,71,0.08)" : "transparent",
                    borderLeft: `2px solid ${active ? "#E8A547" : "transparent"}`,
                  };
                  const content = (
                    <>
                      {icon(active)}
                      <span
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "13px",
                          fontWeight: active ? 400 : 300,
                          color: active ? "#E8E9ED" : "#9CA0AC",
                        }}
                      >
                        {label}
                      </span>
                    </>
                  );
                  if (modal) {
                    return (
                      <button
                        key={id}
                        onClick={openSources}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded transition-all text-left"
                        style={sharedStyle}
                      >
                        {content}
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={id}
                      href={href}
                      className="flex items-center gap-2.5 px-3 py-2 rounded transition-all"
                      style={{ textDecoration: "none", ...sharedStyle }}
                    >
                      {content}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Account footer */}
          <div className="px-4 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(58,61,71,0.4)" }}>
            <div className="flex items-center gap-3 px-1 py-1 rounded hover:bg-[rgba(232,165,71,0.05)] transition-colors cursor-pointer">
              <div
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #E8A547 0%, #C99547 100%)", fontFamily: "JetBrains Mono, monospace", fontSize: "11px", fontWeight: 500, color: "#0A0B0F" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="truncate"
                  style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 400, color: "#E8E9ED" }}
                >
                  {email}
                </div>
                <div
                  style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#9CA0AC", textTransform: "uppercase" as const, marginTop: "1px" }}
                >
                  Workspace
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
