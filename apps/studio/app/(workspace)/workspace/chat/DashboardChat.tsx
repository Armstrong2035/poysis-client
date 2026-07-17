"use client";

import { Chat } from "@/components/ui/chat/Chat";

export function DashboardChat({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="flex flex-col h-screen px-4 py-6 sm:px-8 sm:py-10">
      {/* Header */}
      <div className="mb-6 sm:mb-7 shrink-0">
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "clamp(20px, 2.5vw, 26px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#E8E9ED",
            marginBottom: "6px",
          }}
        >
          Chat
        </h1>
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "14px",
            fontWeight: 300,
            color: "#9CA0AC",
          }}
        >
          Ask questions across your entire knowledge base.
        </p>
      </div>

      {/* Chat — fills remaining height */}
      <div
        className="flex-1 min-h-0 rounded-xl px-3 pb-4 sm:px-4 sm:pb-4"
        style={{
          border: "1px solid rgba(58,61,71,0.4)",
          background: "rgba(58,61,71,0.06)",
        }}
      >
        <Chat
          config={{
            mode: "dashboard",
            notebookId: workspaceId,
            placeholder: "Ask anything about your knowledge base…",
          }}
        />
      </div>
    </div>
  );
}
