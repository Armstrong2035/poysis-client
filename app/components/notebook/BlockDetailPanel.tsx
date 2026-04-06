"use client";

import { useState, useEffect } from "react";
import { FileUploader } from "../ui/input/FileUploader";
import { VariableList } from "../ui/input/VariableList";
import { ChatThread } from "../ui/display/ChatThread";
import { SearchBar } from "../ui/input/SearchBar";
import { SourceAccordion } from "../ui/display/SourceAccordion";
import type { ActiveBlock } from "../../types/canvas";

interface BlockDetailPanelProps {
  block: ActiveBlock;
  blocks: Record<string, any>;
  allBlocks: ActiveBlock[];
  isOpen: boolean;
  onClose: () => void;
  onRename: (name: string) => void;
  onToggleSource: (type: string) => void;
  onSetChainingTarget: (target: { blockId: string; inputKey: string } | undefined) => void;
  onSetTemplatedInput: (inputKey: string, template: string) => void;
}

const BLOCK_EMOJI: Record<string, string> = {
  chat: "💬",
  search: "🔍",
  generate: "🧠",
};

const BLOCK_SUBTITLE: Record<string, string> = {
  chat: "Conversational RAG · Chat with documents",
  search: "Semantic Search · Structured data lookup",
  generate: "Direct AI · No knowledge base",
};

export function BlockDetailPanel({
  block,
  blocks,
  allBlocks,
  isOpen,
  onClose,
  onRename,
  onToggleSource,
  onSetChainingTarget,
  onSetTemplatedInput,
}: BlockDetailPanelProps) {
  const [tab, setTab] = useState<"configure" | "review">("configure");
  const [showVariablePicker, setShowVariablePicker] = useState(false);

  const emoji = BLOCK_EMOJI[block.blockTypeId] || "🔧";
  const subtitle = BLOCK_SUBTITLE[block.blockTypeId] || "";
  const chainableBlocks = allBlocks.filter(b => b.id !== block.id);

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 left-0 right-0 xl:left-[240px] z-50 flex items-stretch animate-in slide-in-from-right duration-300">
        <div className="flex-1 bg-white shadow-2xl flex flex-col overflow-hidden border-l border-zinc-200">

          {/* Panel Header */}
          <div className="flex items-center gap-4 px-8 py-5 border-b border-zinc-100 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
            <span className="text-3xl leading-none">{emoji}</span>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                className="text-2xl font-bold text-zinc-900 bg-transparent border-none outline-none hover:bg-zinc-50 focus:bg-zinc-50 focus:ring-2 focus:ring-blue-100 rounded-lg px-2 py-0.5 -ml-2 w-full transition-all"
                value={block.name}
                onChange={(e) => onRename(e.target.value)}
                placeholder="Block name..."
              />
              <div className="text-xs text-zinc-400 font-medium px-2 mt-0.5">{subtitle}</div>
            </div>

            {/* Tab switcher */}
            <div className="flex items-center bg-zinc-100 rounded-xl p-1 gap-1 flex-shrink-0">
              <button
                onClick={() => setTab("configure")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === "configure" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
              >
                ⚙️ Configure
              </button>
              <button
                onClick={() => setTab("review")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === "review" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
              >
                ▶ Review
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-all flex-shrink-0"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto">

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CONFIGURE TAB                                                 */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {tab === "configure" && (
              <div className="max-w-2xl mx-auto px-8 py-10 space-y-12 animate-in fade-in duration-300">

                {/* ── Data Sources (Chat + Search only) ─────────────────────── */}
                {(block.blockTypeId === "chat" || block.blockTypeId === "search") && (
                  <section>
                    <div className="flex items-center gap-2 mb-5">
                      <span className="w-1.5 h-4 rounded-full bg-blue-500 block"></span>
                      <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Data Sources</h2>
                    </div>
                    <button
                      onClick={() => onToggleSource("static")}
                      className={`w-full p-4 border-2 rounded-2xl flex items-center gap-4 text-left transition-all group ${block.sources.includes("static") ? "border-blue-400 bg-blue-50" : "border-zinc-200 bg-white hover:border-blue-200 hover:bg-blue-50/30"}`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-105 ${block.sources.includes("static") ? "bg-blue-100" : "bg-zinc-100"}`}>
                        🗄️
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-zinc-900">Workspace Library</div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {block.blockTypeId === "search"
                            ? "Upload spreadsheets to enable semantic search"
                            : "Upload PDFs or spreadsheets to build your knowledge base"}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${block.sources.includes("static") ? "bg-blue-500 border-blue-500" : "border-zinc-300"}`}>
                        {block.sources.includes("static") && <span className="text-white text-[10px]">✓</span>}
                      </div>
                    </button>

                    {block.sources.includes("static") && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <FileUploader
                          blockId={block.id}
                          inputKey="documents"
                          acceptedFormats={block.uploadFormats || (block.blockTypeId === "search" ? ["spreadsheet"] : ["pdf", "spreadsheet"])}
                        />
                      </div>
                    )}
                  </section>
                )}

                {/* ── Generate info ──────────────────────────────────────────── */}
                {block.blockTypeId === "generate" && (
                  <section>
                    <div className="p-6 border-2 border-dashed border-zinc-200 bg-zinc-50/50 rounded-2xl text-center">
                      <div className="text-4xl mb-3">🧠</div>
                      <div className="text-sm font-bold text-zinc-800">Direct AI Completion</div>
                      <div className="text-xs text-zinc-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                        No knowledge base needed. Shape the AI&apos;s behaviour with system instructions below.
                      </div>
                    </div>
                  </section>
                )}

                {/* ── Engine Parameters ──────────────────────────────────────── */}
                <section>
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-1.5 h-4 rounded-full bg-violet-500 block"></span>
                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Engine Parameters</h2>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-6">
                    <div>
                      <label className="text-xs font-bold text-zinc-700 mb-2 block">Foundation Model</label>
                      <select className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-100 shadow-sm">
                        <option>Gemini 3 Flash</option>
                        <option>GPT-4o</option>
                        <option>Claude 3.5 Sonnet</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-zinc-700">System Instructions</label>
                        <div className="relative">
                          <button
                            onClick={() => setShowVariablePicker(v => !v)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 transition-colors flex items-center gap-1"
                          >
                            <span>{`{ }`}</span> Insert Variable
                          </button>
                          {showVariablePicker && (
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                              <VariableList
                                currentBlockId={block.id}
                                onSelect={(variable) => {
                                  const current = (blocks[block.id]?.inputBindings?.instructions as any)?.template || "";
                                  onSetTemplatedInput("instructions", current + variable);
                                  setShowVariablePicker(false);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <textarea
                        className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none font-mono h-36 leading-relaxed focus:ring-2 focus:ring-blue-100 transition-all resize-none shadow-sm"
                        value={(blocks[block.id]?.inputBindings?.instructions as any)?.template || ""}
                        onChange={(e) => onSetTemplatedInput("instructions", e.target.value)}
                        placeholder="You are a helpful assistant. Use {{ variable }} to inject live data..."
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400">Block ID:</span>
                        <code className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 font-mono border border-zinc-200">{block.slug}</code>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── Chaining ──────────────────────────────────────────────── */}
                {chainableBlocks.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-5">
                      <span className="w-1.5 h-4 rounded-full bg-amber-500 block"></span>
                      <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Chaining</h2>
                    </div>

                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <div className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                          <span>Variable Handoff</span>
                          {block.chainingTarget ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">App Ready</span>
                          ) : (
                            <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">Required for App</span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">Automatically advance to the next screen when this block completes.</div>
                      </div>
                      <button
                        onClick={() => onSetChainingTarget(block.chainingTarget ? undefined : { blockId: chainableBlocks[0].id, inputKey: "query" })}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${block.chainingTarget ? "bg-emerald-500" : "bg-zinc-200"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${block.chainingTarget ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    {!block.chainingTarget && (
                      <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
                        <span className="text-lg">💡</span>
                        <p className="text-[11px] text-blue-700 leading-relaxed">
                          To add this block to your <b>Mobile App</b>, you must first define a Next Screen. This ensures your users always have a logical path to follow.
                        </p>
                      </div>
                    )}

                      {block.chainingTarget && (
                        <div className="mt-4 pt-4 border-t border-zinc-200 animate-in fade-in slide-in-from-top-2 duration-200">
                          <label className="text-xs font-bold text-zinc-500 mb-2 block">Next Screen</label>
                          <select
                            className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-4 py-2.5 outline-none shadow-sm focus:ring-2 focus:ring-amber-100"
                            value={block.chainingTarget.blockId}
                            onChange={(e) => onSetChainingTarget({ blockId: e.target.value, inputKey: "query" })}
                          >
                            {chainableBlocks.map(b => (
                              <option key={b.id} value={b.id}>{b.name} ({b.blockTypeId})</option>
                            ))}
                          </select>
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600 font-medium">
                            <span>⚡</span>
                            <span>App will automatically advance when the response completes.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* REVIEW TAB — live interactive component                       */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {tab === "review" && (
              <div className="max-w-2xl mx-auto px-8 py-10 animate-in fade-in duration-300">
                <div className="bg-white border-2 border-zinc-200 rounded-3xl shadow-lg overflow-hidden">

                  {/* Review chrome */}
                  <div className="bg-emerald-500 px-5 py-1.5 flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">Live Review · {block.name}</span>
                  </div>

                  {/* Mobile-width simulation */}
                  <div className="p-6 min-h-[400px] flex flex-col">
                    {block.blockTypeId === "chat" && <ChatThread blockId={block.id} />}
                    {block.blockTypeId === "search" && (
                      <div className="space-y-5">
                        <SearchBar blockId={block.id} inputKey="query" />
                        <SourceAccordion blockId={block.id} outputKey="sources" layout="list" theme="card" />
                      </div>
                    )}
                    {block.blockTypeId === "generate" && <ChatThread blockId={block.id} />}
                  </div>

                  {/* Chain forward indicator */}
                  {block.chainingTarget && (
                    <div className="px-6 pb-5 flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border-t border-amber-100 py-3">
                      <span>⛓️</span>
                      <span>On completion → <span className="underline">{allBlocks.find(b => b.id === block.chainingTarget?.blockId)?.name || "Next Block"}</span></span>
                    </div>
                  )}
                </div>

                <p className="text-center text-xs text-zinc-400 mt-4 font-medium">
                  Interact here to test this block. Changes to Configure are reflected instantly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
