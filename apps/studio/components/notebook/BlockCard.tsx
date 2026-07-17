"use client";

import type { ActiveBlock } from "../../types/canvas";

interface BlockCardProps {
  block: ActiveBlock;
  blocks: Record<string, any>;
  allBlocks: ActiveBlock[];
  isInApp: boolean;
  appHasScreens: boolean;
  onClick: () => void;
  onRemove: () => void;
  onToggleApp: () => void;
}

const BLOCK_ICON: Record<string, React.ReactNode> = {
  chat: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5l-3 2V3z" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="7" cy="7" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  ),
  generate: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="8" cy="8" r="3" />
      <line x1="8" y1="1" x2="8" y2="3" />
      <line x1="8" y1="13" x2="8" y2="15" />
      <line x1="1" y1="8" x2="3" y2="8" />
      <line x1="13" y1="8" x2="15" y2="8" />
    </svg>
  ),
};

const BLOCK_SUBTITLE: Record<string, string> = {
  chat: "Conversational Q&A over your knowledge base.",
  search: "Semantic search returning structured results.",
  generate: "Direct AI completion — no knowledge base required.",
};

export function BlockCard({ block, blocks, allBlocks, isInApp, appHasScreens, onClick, onRemove, onToggleApp }: BlockCardProps) {
  const icon = BLOCK_ICON[block.blockTypeId] ?? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="2" y="2" width="12" height="12" rx="2" />
    </svg>
  );
  const subtitle = BLOCK_SUBTITLE[block.blockTypeId] || block.blockTypeId;

  const hasSystemPrompt = !!(blocks[block.id]?.inputBindings?.instructions as any)?.template;
  const hasSources = block.sources.length > 0;
  const hasChaining = !!block.chainingTarget;
  const hasFormatter = !!(blocks[block.id]?.uiConfig?.layout?.length > 0);
  const chainTarget = allBlocks.find(b => b.id === block.chainingTarget?.blockId);

  const missing: string[] = [];
  if ((block.blockTypeId === "chat" || block.blockTypeId === "search") && !hasSources) missing.push("Knowledge Base");
  if (block.blockTypeId === "generate" && !hasSystemPrompt) missing.push("Instructions");
  if (block.blockTypeId === "search" && !hasFormatter) missing.push("Formatter");

  return (
    <div className="group relative">
      <div
        onClick={onClick}
        className="flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all duration-200"
        style={{
          background: isInApp ? "rgba(232,165,71,0.06)" : "rgba(58,61,71,0.15)",
          border: isInApp ? "1px solid rgba(232,165,71,0.3)" : "1px solid rgba(58,61,71,0.4)",
        }}
        onMouseEnter={(e) => {
          if (!isInApp) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(232,165,71,0.25)";
        }}
        onMouseLeave={(e) => {
          if (!isInApp) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(58,61,71,0.4)";
        }}
      >
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
          style={{
            background: isInApp ? "rgba(232,165,71,0.15)" : "rgba(58,61,71,0.4)",
            color: isInApp ? "#E8A547" : "#9CA0AC",
          }}
        >
          {icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700, color: "#E8E9ED", letterSpacing: "-0.01em" }} className="truncate">
              {block.name}
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "8px",
                letterSpacing: "0.15em",
                color: "#E8A547",
                textTransform: "uppercase",
                background: "rgba(232,165,71,0.1)",
                padding: "1px 6px",
                borderRadius: "4px",
                border: "1px solid rgba(232,165,71,0.2)",
                flexShrink: 0,
              }}
            >
              {block.blockTypeId}
            </span>
          </div>

          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#9CA0AC" }}>{subtitle}</div>

          {/* Status chips */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {hasSources && <Chip label="Sources" active />}
            {hasSystemPrompt && <Chip label="Instructions" active />}
            {hasChaining && chainTarget && (
              <Chip label={`→ ${chainTarget.name}`} color="amber" active />
            )}
            {missing.map(m => <Chip key={m} label={m} missing />)}

            <div className="ml-auto flex items-center gap-2 shrink-0">
              {appHasScreens && !hasChaining && !isInApp && (
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.12em", color: "#C99547", textTransform: "uppercase" }}>
                  Needs Handoff
                </span>
              )}
              <button
                disabled={appHasScreens && !hasChaining && !isInApp}
                onClick={(e) => { e.stopPropagation(); onToggleApp(); }}
                className="transition-all"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  border: isInApp ? "1px solid rgba(232,165,71,0.5)" : "1px solid rgba(58,61,71,0.5)",
                  background: isInApp ? "rgba(232,165,71,0.15)" : "rgba(58,61,71,0.3)",
                  color: isInApp ? "#E8A547" : "#9CA0AC",
                  cursor: (appHasScreens && !hasChaining && !isInApp) ? "not-allowed" : "pointer",
                  opacity: (appHasScreens && !hasChaining && !isInApp) ? 0.4 : 1,
                }}
              >
                {isInApp ? "In App" : "+ App"}
              </button>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#3A3D47" strokeWidth="1.3"
          className="flex-shrink-0 group-hover:stroke-[#E8A547] transition-colors">
          <line x1="2" y1="7" x2="12" y2="7" />
          <polyline points="8,3 12,7 8,11" />
        </svg>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all z-10"
        style={{
          background: "rgba(58,61,71,0.5)",
          border: "1px solid rgba(58,61,71,0.6)",
          color: "#9CA0AC",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,83,75,0.2)";
          (e.currentTarget as HTMLButtonElement).style.color = "#C9534B";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(58,61,71,0.5)";
          (e.currentTarget as HTMLButtonElement).style.color = "#9CA0AC";
        }}
        title="Remove block"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="1" y1="1" x2="7" y2="7" /><line x1="7" y1="1" x2="1" y2="7" />
        </svg>
      </button>
    </div>
  );
}

function Chip({ label, active = false, missing = false, color }: { label: string; active?: boolean; missing?: boolean; color?: string }) {
  const isAmber = color === "amber";
  return (
    <span
      style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "8px",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        padding: "2px 6px",
        borderRadius: "4px",
        background: missing
          ? "rgba(201,149,71,0.08)"
          : isAmber
            ? "rgba(201,149,71,0.1)"
            : "rgba(107,176,122,0.08)",
        border: missing
          ? "1px solid rgba(201,149,71,0.3)"
          : isAmber
            ? "1px solid rgba(201,149,71,0.3)"
            : "1px solid rgba(107,176,122,0.25)",
        color: missing ? "#C99547" : isAmber ? "#C99547" : "#6BB07A",
      }}
    >
      {missing ? `○ ${label}` : label}
    </span>
  );
}
