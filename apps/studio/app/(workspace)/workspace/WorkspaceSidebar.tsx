"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { setUiMode } from "@/lib/actions";
import { useConsolidation } from "./ConsolidationContext";
import { QuickAskModal } from "./QuickAskModal";
import { GettingStartedPanel } from "./GettingStartedPanel";
import { useOnboarding } from "./OnboardingContext";

const NAV = [
  { id: "map", href: "/workspace", label: "Knowledge Map", exact: true, glyph: "◈" },
  { id: "canvas", href: "/workspace/canvas", label: "Canvas", exact: false, glyph: "✎" },
  { id: "sources", href: "/workspace/sources", label: "Sources", exact: false, glyph: "⇄" },
  { id: "teams", href: "/workspace/teams", label: "Teams & Permissions", exact: false, glyph: "◎" },
] as const;

export function WorkspaceSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { connections } = useConsolidation();
  const { done } = useOnboarding();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [connectToast, setConnectToast] = useState<"connected" | "denied" | "error" | null>(null);
  const [toastDocs, setToastDocs] = useState(0);
  const [quickAskOpen, setQuickAskOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);

  const ONBOARDING_TOTAL = 7; // 6 tracked keys + "connected a source" (derived live)
  const onboardingDone = Object.values(done).filter(Boolean).length + (connections.length > 0 ? 1 : 0);
  const onboardingPct = Math.round((onboardingDone / ONBOARDING_TOTAL) * 100);

  useEffect(() => {
    const stored = localStorage.getItem("poysis-rail-collapsed");
    if (stored === "true") setCollapsed(true);
    setMounted(true);

    const params = new URLSearchParams(window.location.search);
    const driveParam = params.get("drive");
    if (driveParam) {
      if (driveParam === "connected") {
        setConnectToast("connected");
        fetch("/api/worker/consolidation/indexed-count")
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => { if (d) setToastDocs(d.indexed ?? 0); })
          .catch(() => {});
      } else if (driveParam === "denied") {
        setConnectToast("denied");
      } else {
        setConnectToast("error");
      }
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setConnectToast(null), 4000);
    }
  }, []);

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

  // Switch to the new Creator Studio: persist the choice server-side (so it's
  // also the post-login landing) and navigate there. The workspace is the
  // "enterprise" mode; this is how users leave it for the streamlined UI.
  const goCreator = () => {
    void setUiMode("creator");
    router.push("/studio");
  };

  const toastCopy: Record<string, string> = {
    connected: `✓ Drive connected${toastDocs > 0 ? ` · ${toastDocs.toLocaleString()} docs` : ""}`,
    denied: "Drive connection cancelled",
    error: "Drive connection failed",
  };
  const toastTone = connectToast === "connected" ? "#4B6B49" : "#7E3A33";

  return (
    <div
      className="relative flex flex-col flex-shrink-0"
      style={{
        width: collapsed ? "56px" : "236px",
        height: "100vh",
        background: "#2B362A",
        transition: "width 280ms cubic-bezier(0.32, 0.72, 0.35, 1.05)",
        overflow: "hidden",
      }}
    >
      {connectToast && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg"
          style={{
            background: "#FAF8F0",
            border: `1px solid ${toastTone}33`,
            fontSize: "11px",
            fontWeight: 600,
            color: toastTone,
            whiteSpace: "nowrap",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          {toastCopy[connectToast]}
        </div>
      )}

      {collapsed ? (
        <div className="flex flex-col items-center pt-6 gap-3">
          <button
            onClick={() => setCollapsed(false)}
            className="w-8 h-8 flex items-center justify-center"
            title="Expand ( [ )"
          >
            <span style={{ color: "#C99A5C", fontSize: "15px" }}>✦</span>
          </button>
          <button
            onClick={goCreator}
            className="w-8 h-8 rounded flex items-center justify-center transition-colors"
            style={{ background: "#3C4A3A", color: "#F1EEE2", fontSize: "12px", fontWeight: 700 }}
            title="Switch to the new Creator Studio"
          >
            C
          </button>
          <div style={{ width: "20px", height: "1px", background: "#3C4A3A" }} />
          {NAV.map(({ id, href, label, glyph, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={id}
                href={href}
                className="w-8 h-8 rounded flex items-center justify-center transition-colors"
                style={{ background: active ? "#3C4A3A" : "transparent", color: active ? "#FAF8F0" : "#B7C0B4" }}
                title={label}
              >
                <span style={{ fontSize: "15px" }}>{glyph}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-2 pt-1 pb-5">
            <div className="flex items-center gap-2 px-2">
              <span style={{ color: "#C99A5C", fontSize: "16px" }}>✦</span>
              <span style={{ fontFamily: "var(--font-source-serif), serif", fontWeight: 600, fontSize: "19px", color: "#FAF8F0" }}>
                poysis
              </span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="w-6 h-6 flex items-center justify-center transition-colors"
              style={{ color: "#8A9488" }}
              title="Collapse ( [ )"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" strokeWidth="1.4" stroke="currentColor">
                <polyline points="8,3 4,7 8,11" />
              </svg>
            </button>
          </div>

          {/* Creator / Enterprise mode toggle — Enterprise (this workspace) is
              active here; Creator jumps to the new Studio and remembers it. */}
          <div className="px-2 pb-3">
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#243021" }}>
              <button
                onClick={goCreator}
                className="flex-1 py-1.5 rounded-md transition-colors"
                style={{ background: "transparent", color: "#B7C0B4", fontSize: "12.5px", fontWeight: 600 }}
                title="Switch to the new Creator Studio"
              >
                Creator
              </button>
              <button
                onClick={() => void setUiMode("enterprise")}
                className="flex-1 py-1.5 rounded-md transition-colors"
                style={{ background: "#3C4A3A", color: "#FAF8F0", fontSize: "12.5px", fontWeight: 600 }}
                title="You're in the workspace (Enterprise)"
              >
                Enterprise
              </button>
            </div>
          </div>

          <div className="flex-1 px-2 flex flex-col gap-0.5" style={{ overflowY: "auto", scrollbarWidth: "none" }}>
            {NAV.map(({ id, href, label, glyph, exact }) => {
              const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={id}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors"
                  style={{
                    textDecoration: "none",
                    background: active ? "#3C4A3A" : "transparent",
                    color: active ? "#FAF8F0" : "#B7C0B4",
                    fontSize: "14px",
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <span style={{ fontSize: "15px" }}>{glyph}</span>
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="px-2 pb-1">
            <div className="flex items-center gap-2 px-3 py-2 mb-3" style={{ fontSize: "11px", color: "#8A9488" }}>
              <span>{totalDocs > 0 ? `${totalDocs.toLocaleString()} docs` : "No docs yet"}</span>
              <span>·</span>
              <span>{activeSourceCount > 0 ? `${activeSourceCount} source${activeSourceCount === 1 ? "" : "s"}` : "No sources"}</span>
            </div>

            <button
              onClick={() => setQuickAskOpen(true)}
              className="w-full mb-2 flex items-center justify-center gap-2"
              style={{
                cursor: "pointer",
                border: "1px solid #4A5748",
                background: "#3C4A3A",
                color: "#F1EEE2",
                borderRadius: "9px",
                padding: "11px 14px",
                fontFamily: "var(--font-albert-sans), sans-serif",
                fontSize: "13.5px",
                fontWeight: 600,
              }}
            >
              <span style={{ color: "#C99A5C" }}>✦</span> Quick Ask
            </button>
            <div style={{ fontSize: "11px", color: "#8A9488", padding: "0 4px 12px 4px" }}>
              Runs across everything you can access
            </div>

            <button
              onClick={() => setChecklistOpen(true)}
              className="w-full flex items-center justify-between gap-2"
              style={{
                cursor: "pointer",
                border: "1px solid #4A5748",
                background: "transparent",
                color: "#F1EEE2",
                borderRadius: "9px",
                padding: "11px 14px",
                fontFamily: "var(--font-albert-sans), sans-serif",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <span className="flex items-center gap-2">
                <span style={{ color: "#849777" }}>◐</span> Getting Started
              </span>
              <span style={{ fontSize: "11px", color: "#B7C0B4" }}>{onboardingDone}/{ONBOARDING_TOTAL}</span>
            </button>
            <div style={{ height: "3px", borderRadius: "2px", background: "#46523F", marginTop: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#849777", width: `${onboardingPct}%` }} />
            </div>

            <div className="flex items-center gap-2.5 px-1 py-2 mt-3 rounded-lg" style={{ borderTop: "1px solid #3C4A3A", paddingTop: "12px" }}>
              <div
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #E8A547 0%, #C99547 100%)", fontSize: "11px", fontWeight: 600, color: "#2B362A" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ fontSize: "12px", fontWeight: 500, color: "#F1EEE2" }}>
                  {email}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {quickAskOpen && <QuickAskModal onClose={() => setQuickAskOpen(false)} />}
      {checklistOpen && (
        <GettingStartedPanel
          onClose={() => setChecklistOpen(false)}
          onOpenQuickAsk={() => setQuickAskOpen(true)}
        />
      )}
    </div>
  );
}
