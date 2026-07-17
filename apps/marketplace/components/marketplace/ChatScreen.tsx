"use client";

import { useState } from "react";
import Link from "next/link";
import { Chat } from "@/components/ui/chat/Chat";
import { WaitlistModal } from "./WaitlistModal";

interface ChatScreenProps {
  notebookId: string;
  allowedSources?: string[];
  appLabel: string;
  primaryColor: string;
  backgroundColor: string;
  borderRadius: string;
  showBanner: boolean;
  initialQuery?: string;
}

// Renders a published notebook exactly the way it was built in Studio — its
// own theme (appLabel, primaryColor, backgroundColor, showBanner), driving the
// same Chat component the old PlaygroundView used. The marketplace's own design
// system (top bar, feed) is the directory shell that lists notebooks; clicking
// one lands straight here, on the notebook itself.
export function ChatScreen({
  notebookId,
  allowedSources,
  appLabel,
  primaryColor,
  backgroundColor,
  borderRadius,
  showBanner,
  initialQuery,
}: ChatScreenProps) {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", backgroundColor }}>
      {/* Header — the notebook's own, plus a back link into the directory */}
      <header
        className="shrink-0 px-6 py-4 flex items-center gap-2.5 border-b"
        style={{ borderColor: "rgba(0,0,0,0.07)", backgroundColor }}
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
          style={{ backgroundColor: primaryColor, borderRadius }}
        >
          <div className="w-2.5 h-2.5 bg-white rounded-sm" />
        </div>
        <span className="text-base font-bold text-zinc-900 truncate" style={{ fontFamily: "DM Sans, sans-serif" }}>
          {appLabel}
        </span>
      </header>

      {/* Chat — full height, centered column for readability on wide screens */}
      <div className="flex-1 min-h-0 flex justify-center overflow-hidden">
        <div className="w-full max-w-2xl flex flex-col min-h-0 px-4 md:px-6 py-4">
          <Chat
            config={{
              mode: "playground",
              notebookId,
              playgroundId: notebookId,
              allowedSources,
              branding: { primaryColor },
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
          <Link href="/" className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 transition-colors">
            Powered by Poysis
          </Link>
          <span className="text-[11px] text-zinc-300">·</span>
          <button
            onClick={() => setWaitlistOpen(true)}
            className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            Join the beta
          </button>
        </footer>
      )}

      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </div>
  );
}
