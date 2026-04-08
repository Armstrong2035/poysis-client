"use client";

import { useState, useEffect } from "react";
import { FileUploader } from "../ui/input/FileUploader";
import { VariableList } from "../ui/input/VariableList";
import { ChatThread } from "../ui/display/ChatThread";
import { SearchBar } from "../ui/input/SearchBar";
import { SourceAccordion } from "../ui/display/SourceAccordion";
import { BlueprintDesigner } from "./BlueprintDesigner";
import type { ActiveBlock } from "../../types/canvas";
import { useNotebookStore } from "../../store/notebookStore";

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
  onSetStateSetting: (key: string, value: any) => void;
  onSetUIConfig: (uiConfig: any) => void;
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
  onSetStateSetting,
  onSetUIConfig,
}: BlockDetailPanelProps) {
  const [tab, setTab] = useState<"logic" | "review" | "interface">("logic");
  const { setSelectedBlockId } = useNotebookStore();
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

  // Sync with App Composer (Blueprint Mode)
  useEffect(() => {
    if (isOpen) {
      setSelectedBlockId(block.id);
    } else {
      setSelectedBlockId(null);
    }
    return () => setSelectedBlockId(null);
  }, [isOpen, block.id, setSelectedBlockId]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Detected keys for the Layout Builder reference
  const getOutputKeys = () => {
    const runtime = blocks[block.id];
    if (!runtime || !runtime.outputs) return [];
    
    // For Search blocks, look at the first source
    if (block.blockTypeId === 'search' && Array.isArray(runtime.outputs.sources) && runtime.outputs.sources.length > 0) {
      return Object.keys(runtime.outputs.sources[0]);
    }
    
    // For Chat/Generate blocks, try to parse the last message as JSON
    if ((block.blockTypeId === 'chat' || block.blockTypeId === 'generate') && Array.isArray(runtime.outputs.history) && runtime.outputs.history.length > 0) {
       const last = runtime.outputs.history[runtime.outputs.history.length - 1];
       try {
         const parsed = JSON.parse(last.content);
         return Object.keys(parsed);
       } catch (e) {
         return ['content']; // Fallback to raw content key
       }
    }
    
    return [];
  };

  const detectedKeys = getOutputKeys();

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
                onClick={() => setTab("logic")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === "logic" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
              >
                🧠 Logic
              </button>
              <button
                onClick={() => setTab("review")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === "review" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
              >
                ▶ Test
              </button>
              <button
                onClick={() => setTab("interface")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === "interface" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
              >
                🪄 Formatter
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
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* EXECUTION LOGIC TAB                                          */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {tab === "logic" && (
              <div className="max-w-2xl mx-auto px-8 py-10 space-y-12 animate-in fade-in duration-300">

                {/* ── 1. KNOWLEDGE & CONTEXT ─────────────────────────────── */}
                <section>
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-1.5 h-4 rounded-full bg-emerald-600 block"></span>
                    <h2 className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Library & Context</h2>
                  </div>
                  
                  {/* Always show FileUploader for Search/Chat blocks at the top */}
                  {(block.blockTypeId === "chat" || block.blockTypeId === "search") && (
                    <div className="space-y-4">
                      <div className="bg-zinc-50 border border-zinc-200 rounded-[32px] p-8 border-dashed">
                        <div className="flex items-center justify-between mb-6">
                           <div>
                              <h3 className="text-sm font-bold text-zinc-900">Knowledge Ingestion</h3>
                              <p className="text-[11px] text-zinc-500">Inject documents into Pinecone for this block.</p>
                           </div>
                           <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-xl shadow-sm">🗄️</div>
                        </div>
                        <FileUploader
                          blockId={block.id}
                          inputKey="documents"
                          acceptedFormats={block.uploadFormats || (block.blockTypeId === "search" ? ["spreadsheet"] : ["pdf", "spreadsheet"])}
                        />
                      </div>

                      <div className="p-5 bg-white border border-zinc-100 rounded-3xl shadow-sm">
                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Mapping Guide</div>
                        <div className="text-[11px] text-zinc-500 leading-relaxed italic">
                          This block is connected to <b>{block.name}</b> memory. Queries from the UI will search these documents instantly.
                        </div>
                      </div>
                    </div>
                  )}
                </section>


                {/* ── 1. HERO PERSONA (INSTRUCTIONS) ───────────────────────── */}
                <section>
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-1.5 h-4 rounded-full bg-violet-600 block"></span>
                    <h2 className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">System Persona</h2>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 shadow-sm group hover:border-violet-200 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">Instructions</label>
                      <div className="relative">
                        <button
                          onClick={() => setShowVariablePicker(v => !v)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-all flex items-center gap-1 shadow-sm active:scale-95"
                        >
                          <span>{`{ }`}</span> Insert Variable
                        </button>
                        {showVariablePicker && (
                          <div className="absolute right-0 mt-3 w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden ring-4 ring-black/5">
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
                      className="w-full text-base bg-white border border-zinc-200 rounded-2xl px-5 py-4 outline-none font-mono h-56 leading-relaxed focus:ring-4 focus:ring-violet-50 transition-all resize-none shadow-inner border-zinc-200/60"
                      value={(blocks[block.id]?.inputBindings?.instructions as any)?.template || ""}
                      onChange={(e) => onSetTemplatedInput("instructions", e.target.value)}
                      placeholder="Define the block's personality and goals here..."
                    />
                    <div className="mt-4 flex items-center gap-3">
                       <span className="text-[10px] font-bold text-zinc-400">Context Slug:</span>
                       <code className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-500 font-mono border border-zinc-200">{block.slug}</code>
                    </div>
                  </div>
                </section>

                {/* ── 2. ENGINE SPECS (DASHBOARD) ─────────────────────────── */}
                <section>
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-1.5 h-4 rounded-full bg-blue-600 block"></span>
                    <h2 className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Engine Dashboard</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     {/* Model Selector - Span 2 */}
                     <div className="col-span-2 bg-zinc-50 border border-zinc-200 rounded-3xl p-5 shadow-sm">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase mb-3 block">Foundation Model</label>
                        <select
                          className="w-full text-sm font-bold bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                          value={blocks[block.id]?.stateSettings?.model || "gemini-3-flash"}
                          onChange={(e) => onSetStateSetting("model", e.target.value)}
                        >
                          <option value="gemini-3-flash">Gemini 3 Flash</option>
                          <option value="gpt-4o">GPT-4o</option>
                          <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                        </select>
                     </div>

                     {/* Creativity (Facts vs Flair) */}
                     {(block.blockTypeId === 'chat' || block.blockTypeId === 'generate') && (
                       <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Creativity</label>
                            <span className="text-xs font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                              {(blocks[block.id]?.stateSettings?.creativity ?? 0.5).toFixed(1)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            value={blocks[block.id]?.stateSettings?.creativity ?? 0.5}
                            onChange={(e) => onSetStateSetting("creativity", parseFloat(e.target.value))}
                          />
                          <div className="flex justify-between mt-3 px-0.5">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase">Facts</span>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase">Flair</span>
                          </div>
                       </div>
                     )}

                     {/* Output Length */}
                     {(block.blockTypeId === 'chat' || block.blockTypeId === 'generate') && (
                       <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Max Tokens</label>
                            <span className="text-xs font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                              {blocks[block.id]?.stateSettings?.maxTokens || 1000}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="2048"
                            step="50"
                            className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            value={blocks[block.id]?.stateSettings?.maxTokens || 1000}
                            onChange={(e) => onSetStateSetting("maxTokens", parseInt(e.target.value))}
                          />
                          <div className="flex justify-between mt-3 px-0.5">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase">Short</span>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase">Long</span>
                          </div>
                       </div>
                     )}

                     {/* Search Limit (Top K) */}
                     {block.blockTypeId === 'search' && (
                       <div className="col-span-2 bg-zinc-50 border border-zinc-200 rounded-3xl p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Search Precision (Top K)</label>
                            <span className="text-xs font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{blocks[block.id]?.stateSettings?.limit || 5}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            step="1"
                            className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            value={blocks[block.id]?.stateSettings?.limit || 5}
                            onChange={(e) => onSetStateSetting("limit", parseInt(e.target.value))}
                          />
                          <div className="flex justify-between mt-3 px-0.5">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase">Precise</span>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase">Comprehensive</span>
                          </div>
                       </div>
                     )}
                  </div>
                </section>


                {/* ── 4. HANDOFF ACTION ────────────────────────────────────── */}
                {chainableBlocks.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-5">
                      <span className="w-1.5 h-4 rounded-full bg-amber-600 block"></span>
                      <h2 className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Handoff Action</h2>
                    </div>

                    <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 shadow-sm group hover:border-amber-200 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <div className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                             Routing Target
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-1">Jump to another screen after this block runs.</div>
                        </div>
                        <button
                          onClick={() => onSetChainingTarget(block.chainingTarget ? undefined : { blockId: chainableBlocks[0].id, inputKey: "query" })}
                          className={`relative w-12 h-6.5 rounded-full transition-all flex-shrink-0 shadow-inner ${block.chainingTarget ? "bg-amber-500" : "bg-zinc-200"}`}
                        >
                          <div className={`absolute top-1 w-4.5 h-4.5 rounded-full bg-white shadow-md transition-all ${block.chainingTarget ? "translate-x-6.5" : "translate-x-1"}`} />
                        </button>
                      </div>

                      {block.chainingTarget && (
                        <div className="mt-5 pt-5 border-t border-zinc-200 animate-in fade-in slide-in-from-top-2 duration-200">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase mb-3 block">Link to Screen</label>
                          <select
                            className="w-full text-sm font-bold bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none shadow-sm focus:ring-4 focus:ring-amber-50"
                            value={block.chainingTarget.blockId}
                            onChange={(e) => onSetChainingTarget({ blockId: e.target.value, inputKey: "query" })}
                          >
                            {chainableBlocks.map(b => (
                              <option key={b.id} value={b.id}>{b.name} ({b.blockTypeId})</option>
                            ))}
                          </select>
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
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">Live Test · {block.name}</span>
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
            {tab === "interface" && (
                <div className="max-w-4xl mx-auto px-8 py-10">
                   <div className="mb-10">
                      <h2 className="text-2xl font-black text-zinc-900 mb-2">Card Formatter</h2>
                      <p className="text-sm text-zinc-500 font-medium">Map your block's data output to visual UI components.</p>
                   </div>
                   <BlueprintDesigner blockId={block.id} mode="panel" />
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
