"use client";

import { Chat } from "@/components/ui/chat/Chat";

interface PlaygroundViewProps {
  notebookId: string;
  ownerId: string;
  appLabel: string;
  primaryColor: string;
  backgroundColor: string;
  borderRadius: string;
  allowedSources?: string[];
  showBanner: boolean;
}

export function PlaygroundView({
  notebookId,
  ownerId,
  appLabel,
  primaryColor,
  backgroundColor,
  borderRadius,
  allowedSources,
  showBanner,
}: PlaygroundViewProps) {
  return (
    <div
      className="flex flex-col items-center justify-start min-h-screen py-0 md:py-10"
      style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
    >
      {/* Phone card */}
      <div
        className="w-full md:max-w-[430px] flex flex-col md:rounded-[40px] md:shadow-2xl overflow-hidden"
        style={{
          backgroundColor,
          minHeight: "100dvh",
          maxHeight: "100dvh",
        }}
      >
        {/* Status bar (desktop only) */}
        <div
          className="hidden md:flex shrink-0 px-6 pt-4 pb-1 items-center justify-between"
          style={{ backgroundColor }}
        >
          <span className="text-[11px] font-bold text-zinc-800" style={{ letterSpacing: "-0.02em" }}>
            9:41
          </span>
          <div className="flex items-center gap-1.5">
            <svg width="13" height="10" viewBox="0 0 11 8" fill="none">
              <rect x="0" y="5.5" width="1.8" height="2.5" rx="0.4" fill="#18181b" />
              <rect x="2.3" y="3.5" width="1.8" height="4.5" rx="0.4" fill="#18181b" />
              <rect x="4.6" y="1.5" width="1.8" height="6.5" rx="0.4" fill="#18181b" />
              <rect x="6.9" y="0" width="1.8" height="8" rx="0.4" fill="#18181b" />
            </svg>
          </div>
        </div>

        {/* App header */}
        <div
          className="shrink-0 px-5 py-3 flex items-center justify-between border-b"
          style={{ borderColor: "rgba(0,0,0,0.07)", backgroundColor }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="w-2 h-2 bg-white rounded-sm" />
            </div>
            <span
              className="text-sm font-bold text-zinc-900 uppercase tracking-tight truncate"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              {appLabel}
            </span>
          </div>
          {showBanner && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                Live
              </span>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0 px-4 pb-4 pt-2">
          <Chat
            config={{
              mode: "playground",
              notebookId,
              playgroundId: notebookId,
              allowedSources,
              branding: { primaryColor },
              placeholder: "Ask a question…",
            }}
          />
        </div>

        {/* Home indicator */}
        <div
          className="hidden md:flex shrink-0 items-center justify-center py-3"
          style={{ backgroundColor }}
        >
          <div className="h-1 w-20 rounded-full bg-zinc-800/50" />
        </div>
      </div>
    </div>
  );
}
