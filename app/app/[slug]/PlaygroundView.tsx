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
    <div className="flex flex-col h-screen" style={{ backgroundColor }}>
      {/* Header */}
      <header
        className="shrink-0 px-6 py-4 flex items-center gap-2.5 border-b"
        style={{ borderColor: "rgba(0,0,0,0.07)", backgroundColor }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="w-2.5 h-2.5 bg-white rounded-sm" />
        </div>
        <span
          className="text-base font-bold text-zinc-900 truncate"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
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
          />
        </div>
      </div>

      {showBanner && (
        <footer className="shrink-0 py-2.5 text-center">
          <a
            href="https://poysis.app"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Powered by Poysis
          </a>
        </footer>
      )}
    </div>
  );
}
