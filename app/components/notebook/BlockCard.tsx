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

const BLOCK_EMOJI: Record<string, string> = {
  chat: "💬",
  search: "🔍",
  generate: "🧠",
};

const BLOCK_SUBTITLE: Record<string, string> = {
  chat: "Chat with documents",
  search: "Structured data lookup",
  generate: "Direct AI completion",
};

const BLOCK_COLOR: Record<string, string> = {
  chat: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
  search: "bg-blue-50 border-blue-200 hover:border-blue-400",
  generate: "bg-violet-50 border-violet-200 hover:border-violet-400",
};

const BLOCK_BADGE: Record<string, string> = {
  chat: "bg-emerald-100 text-emerald-700",
  search: "bg-blue-100 text-blue-700",
  generate: "bg-violet-100 text-violet-700",
};

export function BlockCard({ block, blocks, allBlocks, isInApp, appHasScreens, onClick, onRemove, onToggleApp }: BlockCardProps) {
  const emoji = BLOCK_EMOJI[block.blockTypeId] || "🔧";
  const subtitle = BLOCK_SUBTITLE[block.blockTypeId] || block.blockTypeId;
  const colorClass = BLOCK_COLOR[block.blockTypeId] || "bg-zinc-50 border-zinc-200 hover:border-zinc-400";
  const badgeClass = BLOCK_BADGE[block.blockTypeId] || "bg-zinc-100 text-zinc-600";

  // Config status indicators
  const hasSystemPrompt = !!(blocks[block.id]?.inputBindings?.instructions as any)?.template;
  const hasSources = block.sources.length > 0;
  const hasChaining = !!block.chainingTarget;
  const chainTarget = allBlocks.find(b => b.id === block.chainingTarget?.blockId);

  return (
    <div className="group relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Clickable tile */}
      <div
        onClick={onClick}
        className={`group relative flex items-center gap-4 px-6 py-5 rounded-[22px] border-2 transition-all duration-300 cursor-pointer min-w-[360px] ${
          isInApp
            ? "bg-white border-emerald-100 shadow-lg shadow-emerald-500/5 -translate-y-1"
            : "bg-white border-zinc-100 hover:border-zinc-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/40"
        }`}
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-white/80 flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-110">
          {emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-zinc-900 text-base truncate">{block.name}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide ${badgeClass}`}>
              {block.blockTypeId}
            </span>
          </div>
          <div className="text-xs text-zinc-500">{subtitle}</div>

          {/* Status chips + App toggle */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {hasSources && (
              <span className="text-[10px] font-semibold bg-white/80 border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                🗄️ Sources
              </span>
            )}
            {hasSystemPrompt && (
              <span className="text-[10px] font-semibold bg-white/80 border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                ✏️ Instructions
              </span>
            )}
            {hasChaining && chainTarget && (
              <span className="text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                ⛓️ → {chainTarget.name}
              </span>
            )}

            {/* App toggle */}
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {/* Only show unchained warning after the first block is already in the app */}
              {appHasScreens && !hasChaining && !isInApp && (
                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">
                  ⚠ Needs Handoff
                </span>
              )}
              <button
                disabled={appHasScreens && !hasChaining && !isInApp}
                onClick={(e) => { e.stopPropagation(); onToggleApp(); }}
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                  isInApp
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                    : (appHasScreens && !hasChaining)
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-300 cursor-not-allowed opacity-60'
                      : 'bg-white border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:bg-zinc-50 shadow-sm'
                }`}
                title={(appHasScreens && !hasChaining && !isInApp) ? "Define a 'Next Screen' (Chaining) in block settings to add this to the app." : ""}
              >
                {isInApp ? '📱 In App' : '+ Add to App'}
              </button>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="text-zinc-300 group-hover:text-zinc-500 text-lg transition-all group-hover:translate-x-1 flex-shrink-0">
          →
        </div>
      </div>

      {/* Delete button — appears on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-all shadow-sm text-xs z-10"
        title="Delete block"
      >
        ✕
      </button>
    </div>
  );
}
