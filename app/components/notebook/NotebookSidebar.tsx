"use client";

import { useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { logout } from "../../lib/auth";

interface NotebookSidebarProps {
  user: User;
  onConfigOpen: () => void;
  notebookTitle: string;
  isSaving: boolean;
  lastSaved: Date | null;
  onTitleChange: (value: string) => void;
  onSave: () => void;
  slug: string;
  onSlugSave: (slug: string) => Promise<string | null>;
}

export function NotebookSidebar({ user, onConfigOpen, notebookTitle, isSaving, lastSaved, onTitleChange, onSave, slug, onSlugSave }: NotebookSidebarProps) {
  const initial = user.email?.charAt(0).toUpperCase() ?? "?";
  const [slugDraft, setSlugDraft] = useState(slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugSaved, setSlugSaved] = useState(false);

  const handleSlugSave = async () => {
    if (!slugDraft.trim() || slugDraft === slug) return;
    setSlugSaving(true);
    setSlugError(null);
    const err = await onSlugSave(slugDraft);
    setSlugSaving(false);
    if (err) { setSlugError(err); } else { setSlugSaved(true); setTimeout(() => setSlugSaved(false), 2000); }
  };

  return (
    <div
      className="w-64 hidden sm:flex flex-col h-screen sticky top-0 shrink-0 z-20"
      style={{
        background: "rgba(10,11,15,0.96)",
        borderRight: "1px solid rgba(58,61,71,0.4)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Wordmark */}
      <div className="flex items-baseline gap-1.5 px-5 pt-6 pb-5">
        <span style={{ fontFamily: "Syne, sans-serif", fontSize: "17px", fontWeight: 800, letterSpacing: "-0.04em", color: "#E8E9ED" }}>
          Poysis
        </span>
        <div className="w-1.5 h-1.5 bg-[#E8A547] rounded-full" style={{ transform: "translateY(-6px)", boxShadow: "0 0 8px rgba(232,165,71,0.6)" }} />
      </div>

      {/* Title input */}
      <div className="px-4 mb-3">
        <input
          value={notebookTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          placeholder="Untitled Notebook"
          className="w-full rounded-lg px-3 py-2 outline-none transition-all"
          style={{
            background: "transparent",
            border: "1px solid transparent",
            fontFamily: "Syne, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#E8E9ED",
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = "rgba(58,61,71,0.2)";
            e.currentTarget.style.borderColor = "rgba(232,165,71,0.3)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
            onSave();
          }}
        />
      </div>

      {/* Save status */}
      <div className="px-7 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: isSaving ? "#C99547" : "#6BB07A",
              boxShadow: isSaving ? "0 0 5px rgba(201,149,71,0.6)" : "0 0 5px rgba(107,176,122,0.6)",
              animation: isSaving ? "pulse 1s ease-in-out infinite" : "none",
            }}
          />
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#9CA0AC", textTransform: "uppercase" }}>
            {isSaving ? "Saving…" : lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Draft"}
          </span>
        </div>
        <button
          onClick={onSave}
          disabled={isSaving}
          style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#E8A547", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer" }}
          className="hover:text-[#F5B25F] transition-colors disabled:opacity-40"
        >
          Save
        </button>
      </div>

      <div style={{ borderTop: "1px solid rgba(58,61,71,0.4)", margin: "0 16px 12px" }} />

      {/* Nav */}
      <div className="px-4 flex flex-col gap-1">
        <Link
          href="/workspace"
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group"
          style={{ textDecoration: "none" }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#9CA0AC" strokeWidth="1.3"
            className="group-hover:stroke-[#E8E9ED] transition-colors">
            <line x1="11" y1="6.5" x2="2" y2="6.5" />
            <polyline points="5.5,3 2,6.5 5.5,10" />
          </svg>
          <span
            style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC" }}
            className="group-hover:text-[#E8E9ED] transition-colors"
          >
            Back to Playground
          </span>
        </Link>

        <button
          onClick={onConfigOpen}
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group text-left"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#9CA0AC" strokeWidth="1.3"
            className="group-hover:stroke-[#E8E9ED] transition-colors">
            <circle cx="6.5" cy="6.5" r="1.5" />
            <path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.6 2.6l1 1M9.4 9.4l1 1M9.4 2.6l-1 1M2.6 9.4l1-1" />
          </svg>
          <span
            style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC" }}
            className="group-hover:text-[#E8E9ED] transition-colors"
          >
            Project Config
          </span>
        </button>
      </div>

      {/* Publish */}
      <div className="px-4 mt-4">
        <div style={{ borderTop: "1px solid rgba(58,61,71,0.4)", paddingTop: "14px" }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#9CA0AC", textTransform: "uppercase" as const, marginBottom: "8px", paddingLeft: "4px" }}>
            Publish
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#3A3D47", flexShrink: 0 }}>/p/</span>
            <input
              value={slugDraft}
              onChange={(e) => { setSlugDraft(e.target.value); setSlugError(null); setSlugSaved(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); handleSlugSave(); } }}
              onBlur={handleSlugSave}
              placeholder="my-app"
              className="flex-1 rounded px-2 py-1 outline-none transition-all"
              style={{
                background: "rgba(58,61,71,0.2)",
                border: "1px solid rgba(58,61,71,0.4)",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "11px",
                color: "#E8E9ED",
                minWidth: 0,
              }}
            />
          </div>
          {slugError && (
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "10px", color: "#C9534B", marginTop: "5px", paddingLeft: "4px" }}>
              {slugError}
            </p>
          )}
          {slugSaved && (
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "10px", color: "#6BB07A", marginTop: "5px", paddingLeft: "4px" }}>
              ✓ Saved
            </p>
          )}
          {slugDraft && !slugError && !slugSaving && (
            <button
              onClick={() => { const url = `${window.location.origin}/p/${slugDraft}`; navigator.clipboard.writeText(url); }}
              className="mt-2 w-full py-1.5 rounded transition-all hover:bg-[rgba(232,165,71,0.12)]"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#E8A547", textTransform: "uppercase" as const, border: "1px solid rgba(232,165,71,0.25)", background: "transparent", cursor: "pointer" }}
            >
              Copy Link
            </button>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Account footer */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(58,61,71,0.4)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #E8A547 0%, #C99547 100%)", fontFamily: "JetBrains Mono, monospace", fontSize: "11px", fontWeight: 500, color: "#0A0B0F" }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 400, color: "#E8E9ED" }}>{user.email}</div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#9CA0AC", textTransform: "uppercase" }}>
              {user.role || "User"}
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="hover:text-[#C9534B] transition-colors"
            style={{ color: "#3A3D47", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}
            title="Sign out"
          >
            ↪
          </button>
        </div>
      </div>
    </div>
  );
}
