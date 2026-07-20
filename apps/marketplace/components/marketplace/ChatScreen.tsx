"use client";

import { useState } from "react";
import Link from "next/link";
import { Chat } from "@/components/ui/chat/Chat";
import { WaitlistModal } from "./WaitlistModal";

interface ChatScreenProps {
  notebookId: string;
  allowedSources?: string[];
  appLabel: string;
  showBanner: boolean;
  shape?: string[];
  initialQuery?: string;
}

// Renders a published notebook in the marketplace's own design system (the same
// tokens as the directory shell), so a notebook reads as part of the site and
// follows its light/dark reading-room — rather than carrying a per-notebook
// custom color. Only the notebook's name (appLabel) and banner toggle remain
// notebook-specific. Drives the same Chat component the old PlaygroundView used.
export function ChatScreen({
  notebookId,
  allowedSources,
  appLabel,
  showBanner,
  shape,
  initialQuery,
}: ChatScreenProps) {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "var(--ground)" }}>
      {/* Header — plus a back link into the directory */}
      <header
        className="shrink-0 px-6 py-4 flex items-center gap-2.5 border-b"
        style={{ borderColor: "var(--rule)", background: "var(--card)" }}
      >
        <Link
          href="/"
          aria-label="Back to marketplace"
          className="shrink-0 -ml-1 mr-1 flex items-center justify-center rounded-md transition-opacity hover:opacity-60"
          style={{ width: 28, height: 28, color: "#55594D" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: "var(--accent)" }}
        >
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--ground)" }} />
        </div>
        <span className="text-base font-bold truncate" style={{ fontFamily: "DM Sans, sans-serif", color: "var(--ink)" }}>
          {appLabel}
        </span>
      </header>

      {/* Chat — full height, centered column for readability on wide screens */}
      <div className="flex-1 min-h-0 flex justify-center overflow-hidden">
        <div className="w-full max-w-2xl flex flex-col min-h-0 px-4 md:px-6 py-4">
          {/* Notebook shape — the body of work at a glance, so the reader builds a
              mental model of what this creator talks about rather than treating it
              as isolated answers. */}
          {shape && shape.length > 0 && (
            <div className="shrink-0 mb-3">
              <p
                className="text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                style={{ fontFamily: "DM Sans, sans-serif", color: "var(--faint)" }}
              >
                This notebook covers
              </p>
              <div className="flex flex-wrap gap-1.5">
                {shape.map((label) => (
                  <span
                    key={label}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: "var(--accent-soft)",
                      color: "var(--accent)",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Chat
            config={{
              mode: "playground",
              notebookId,
              playgroundId: notebookId,
              allowedSources,
              placeholder: "Ask a question…",
            }}
            initialQuery={initialQuery}
          />
        </div>
      </div>

      {showBanner && (
        <footer
          className="shrink-0 py-2.5 px-4 flex items-center justify-center gap-2 flex-wrap"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          <Link href="/" className="text-[11px] font-medium transition-opacity hover:opacity-70" style={{ color: "var(--faint)" }}>
            Powered by Poysis
          </Link>
          <span className="text-[11px]" style={{ color: "var(--faint)", opacity: 0.6 }}>·</span>
          <button
            onClick={() => setWaitlistOpen(true)}
            className="text-[11px] font-medium transition-opacity hover:opacity-70"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--faint)" }}
          >
            Join the beta
          </button>
        </footer>
      )}

      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </div>
  );
}
