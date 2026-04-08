"use client";

import { SearchBar } from "../ui/input/SearchBar";
import { SourceAccordion } from "../ui/display/SourceAccordion";
import { ChatThread } from "../ui/display/ChatThread";
import { ThemeCustomizer } from "./ThemeCustomizer";
import { BlueprintDesigner } from "./BlueprintDesigner";
import type { ActiveBlock } from "../../types/canvas";
import { useNotebookStore } from "../../store/notebookStore";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface AppComposerProps {
  activeBlocks: ActiveBlock[];
  notebookId?: string;
  isVisible: boolean;
  onToggle: () => void;
}

const BLOCK_EMOJI: Record<string, string> = {
  chat: "💬",
  search: "🔍",
  generate: "🧠",
};

export function AppComposer({ activeBlocks, notebookId, isVisible, onToggle }: AppComposerProps) {
  const {
    activePreviewBlockId,
    setActivePreviewBlock,
    theme,
    appScreens,
    addToApp,
    removeFromApp,
    reorderAppScreens,
    selectedBlockId,
    setSelectedBlockId,
  } = useNotebookStore();

  const [activeTab, setActiveTab] = useState<"screens" | "design">("screens");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  const [deployTab, setDeployTab] = useState<"notebook" | "widget">("notebook");
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://poysis.app";
  const previewUrl = `${origin}/preview?id=${notebookId}`;
  const embedSnippet = `<script\n  src="${origin}/embed.js"\n  data-notebook-id="${notebookId}"\n  data-label="Ask us anything"\n  data-color="${theme.primaryColor}"\n  async>\n</script>`;
  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // Screens in order — only blocks that have been explicitly added
  const screenBlocks = appScreens
    .map(id => activeBlocks.find(b => b.id === id))
    .filter(Boolean) as ActiveBlock[];

  // Blocks NOT yet in the app
  const notInApp = activeBlocks.filter(b => !appScreens.includes(b.id));

  // Active preview block within the screen list
  const currentBlockId = activePreviewBlockId && appScreens.includes(activePreviewBlockId)
    ? activePreviewBlockId
    : appScreens[0] || null;
  const currentBlock = activeBlocks.find(b => b.id === currentBlockId) || null;

  // Reorder helpers
  const moveScreen = (index: number, dir: -1 | 1) => {
    const next = [...appScreens];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    reorderAppScreens(next);
  };

  const [showAddMenu, setShowAddMenu] = useState(false);

  // CSS variable injection wrapper style
  const themeVars = {
    "--primary-color": theme.primaryColor,
    "--app-bg": theme.backgroundColor,
    "--radius": theme.borderRadius,
    "--border-width": theme.borderWidth,
    "--shadow": theme.boxShadow,
  } as React.CSSProperties;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className={`fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-lg transition-all xl:hidden ${isVisible ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
        title={isVisible ? "Hide Composer" : "Show Composer"}
      >
        {isVisible ? "✕" : "📱"}
      </button>

      {/* Desktop panel wrapper */}
      <div className={`hidden xl:flex shrink-0 transition-all duration-300 ease-in-out ${isVisible ? "w-[780px] 2xl:w-[960px]" : "w-12"}`}>

        {/* Collapse handle */}
        <button
          onClick={onToggle}
          className="h-screen sticky top-0 flex items-center justify-center w-12 bg-zinc-50 border-l border-zinc-200/80 hover:bg-zinc-100 transition-colors group shrink-0"
          title={isVisible ? "Collapse Composer" : "Expand Composer"}
        >
          <span
            className="text-zinc-400 group-hover:text-zinc-600 text-xs transition-colors select-none"
            style={{ writingMode: isVisible ? "horizontal-tb" : "vertical-rl" }}
          >
            {isVisible ? "◀" : "📱 Composer"}
          </span>
        </button>

        {/* Panel body */}
        {isVisible && (
          <div className="flex-1 border-l border-zinc-200/80 bg-white flex flex-row h-screen overflow-hidden sticky top-0">

            {/* ─── Column 1: Editor (Screens & Design) ─── */}
            <div className="w-[300px] 2xl:w-[380px] flex flex-col border-r border-zinc-100 bg-[#FAFAFA] shrink-0 overflow-hidden">
              {/* Header */}
              <div className="px-5 pt-5 pb-4 border-b border-zinc-200/80 bg-white shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <span>📱</span>
                    <span>App Composer</span>
                  </div>
                  {notebookId && (
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setShowDropdown(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-[11px] font-bold hover:-translate-y-px active:translate-y-0 transition-all"
                      >
                        🚀 Launch App <span className="opacity-60 text-[9px]">▾</span>
                      </button>
                      {showDropdown && (
                        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-zinc-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                          <Link
                            href={previewUrl}
                            target="_blank"
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                          >
                            <span>👁️</span> Preview
                          </Link>
                          <div className="border-t border-zinc-100" />
                          <button
                            onClick={() => { setDeployTab("notebook"); setShowDeploy(true); setShowDropdown(false); setCopied(false); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                          >
                            <span>🔗</span> Deploy as Notebook
                          </button>
                          <button
                            onClick={() => { setDeployTab("widget"); setShowDeploy(true); setShowDropdown(false); setCopied(false); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                          >
                            <span>{"</>"}</span> Deploy as Widget
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!selectedBlockId && (
                  <div className="flex bg-zinc-100 p-1 rounded-xl">
                    <button
                      onClick={() => setActiveTab("screens")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "screens" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                    >
                      🛠️ App Screens
                    </button>
                    <button
                      onClick={() => setActiveTab("design")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "design" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                    >
                      🎨 Design
                    </button>
                  </div>
                )}
              </div>

              {/* Scrollable Editor Content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {selectedBlockId ? (
                   <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="px-5 py-3 bg-zinc-900 flex items-center justify-between shadow-lg relative z-20">
                         <div className="flex items-center gap-2">
                            <span className="text-sm">📐</span>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Blueprint Designer</span>
                         </div>
                         <button 
                           onClick={() => setSelectedBlockId(null)}
                           className="text-[10px] font-black text-white/50 hover:text-white transition-all flex items-center gap-1 group"
                         >
                           ✕ <span className="group-hover:translate-x-0.5 transition-transform text-[9px]">BACK TO APP</span>
                         </button>
                      </div>
                      <div className="flex-1 overflow-hidden">
                         <BlueprintDesigner blockId={selectedBlockId} />
                      </div>
                   </div>
                ) : activeTab === "design" ? (
                  <div className="p-5 animate-in fade-in slide-in-from-left-2 duration-300">
                    <ThemeCustomizer />
                  </div>
                ) : (
                  <div className="p-5 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">App Navigation</div>

                    {screenBlocks.length === 0 ? (
                      <div className="text-xs text-zinc-400 text-center py-10 border-2 border-dashed border-zinc-200 rounded-xl px-6">
                        No screens yet. Click <strong>+ Add to App</strong> on any block in the canvas to include it here.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {screenBlocks.map((block, i) => (
                          <div
                            key={block.id}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all group ${
                              currentBlockId === block.id
                                ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-200/50"
                                : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:shadow-sm"
                            }`}
                            onClick={() => setActivePreviewBlock(block.id)}
                          >
                            <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); moveScreen(i, -1); }}
                                disabled={i === 0}
                                className="text-[9px] text-zinc-400 hover:text-zinc-700 disabled:opacity-20"
                              >
                                ▲
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); moveScreen(i, 1); }}
                                disabled={i === screenBlocks.length - 1}
                                className="text-[9px] text-zinc-400 hover:text-zinc-700 disabled:opacity-20"
                              >
                                ▼
                              </button>
                            </div>

                            <span className="text-base shrink-0">{BLOCK_EMOJI[block.blockTypeId] || "🔧"}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold truncate">{block.name}</div>
                              <div className={`text-[10px] ${currentBlockId === block.id ? "text-white/60" : "text-zinc-400"} capitalize`}>{block.blockTypeId}</div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${currentBlockId === block.id ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                              {i + 1}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeFromApp(block.id); }}
                              className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${currentBlockId === block.id ? "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white" : "text-zinc-300 hover:bg-red-50 hover:text-red-400"}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add screen menu button */}
                    <div className="relative mt-3">
                      <button
                        onClick={() => setShowAddMenu(v => !v)}
                        className="w-full flex items-center justify-center gap-1.5 py-3 border border-dashed border-zinc-300 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 hover:border-zinc-500 hover:bg-zinc-50/50 transition-all shadow-sm"
                      >
                        + Add Screen to App
                      </button>
                      {showAddMenu && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                          {appScreens.length === 0
                            ? notInApp.map(block => (
                                <button
                                  key={block.id}
                                  onClick={() => { addToApp(block.id); setShowAddMenu(false); }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
                                >
                                  <span className="text-xl">{BLOCK_EMOJI[block.blockTypeId] || "🔧"}</span>
                                  <div>
                                    <div className="text-xs font-bold text-zinc-900">{block.name}</div>
                                    <div className="text-[10px] text-zinc-400 capitalize">{block.blockTypeId}</div>
                                  </div>
                                </button>
                              ))
                            : notInApp.filter(b => !!b.chainingTarget).length === 0
                              ? (
                                <div className="p-6 text-center">
                                  <div className="text-xl mb-2">⛓️</div>
                                  <div className="text-[11px] font-bold text-zinc-900 mb-1">No more "App Ready" blocks</div>
                                  <p className="text-[10px] text-zinc-500 leading-relaxed px-2">
                                    Remaining blocks need a <b>Next Screen</b> defined before they can be added after the first screen.
                                  </p>
                                </div>
                              )
                              : notInApp.filter(b => !!b.chainingTarget).map(block => (
                                <button
                                  key={block.id}
                                  onClick={() => { addToApp(block.id); setShowAddMenu(false); }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
                                >
                                  <span className="text-xl">{BLOCK_EMOJI[block.blockTypeId] || "🔧"}</span>
                                  <div>
                                    <div className="text-xs font-bold text-zinc-900">{block.name}</div>
                                    <div className="text-[10px] text-zinc-400 capitalize">{block.blockTypeId}</div>
                                  </div>
                                </button>
                              ))
                          }
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Column 2: Live Preview ─── */}
            <div className="flex-1 flex flex-col bg-zinc-50/30 overflow-hidden min-w-0">
              <div className="px-5 pt-5 pb-4 border-b border-zinc-100 bg-white shrink-0 flex items-center justify-between">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Preview</div>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <span className="text-[9px] font-bold text-zinc-500 uppercase">Interactive</span>
                </div>
              </div>

              {/* iPhone Frame Wrapper — Fluid and robustly centered */}
              <div className="flex-1 p-8 overflow-y-auto bg-zinc-50/50">
                <div className="min-h-full w-full flex items-center justify-center">
                    {/* Outer phone body */}
                    <div className="relative shrink-0 shadow-2xl" style={{ width: 248, height: 530, margin: '20px 0' }}>
                    {/* Volume buttons (left) */}
                    <div className="absolute -left-[3.5px] top-[90px] w-[3.5px] h-5 bg-zinc-700 rounded-l-sm shadow-sm" />
                    <div className="absolute -left-[3.5px] top-[120px] w-[3.5px] h-8 bg-zinc-700 rounded-l-sm shadow-sm" />
                    <div className="absolute -left-[3.5px] top-[158px] w-[3.5px] h-8 bg-zinc-700 rounded-l-sm shadow-sm" />
                    {/* Power button (right) */}
                    <div className="absolute -right-[3.5px] top-[120px] w-[3.5px] h-12 bg-zinc-700 rounded-r-sm shadow-sm" />

                    {/* Phone bezel */}
                    <div
                      className="absolute inset-0 bg-zinc-900"
                      style={{
                        borderRadius: 42,
                        boxShadow: '0 24px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.07)'
                      }}
                    />

                    {/* Screen glass */}
                    <div
                      className={`absolute flex flex-col overflow-hidden ${theme.fontFamily}`}
                      style={{
                        inset: 6,
                        borderRadius: 38,
                        backgroundColor: theme.backgroundColor,
                        transition: 'background-color 0.3s',
                        ...themeVars,
                      }}
                    >
                      {/* Status bar */}
                      <div
                        className="shrink-0 px-5 pt-3 pb-1 flex items-center justify-between relative"
                        style={{ backgroundColor: theme.backgroundColor }}
                      >
                        <span className="text-[9px] font-bold text-zinc-800" style={{ letterSpacing: '-0.02em' }}>9:41</span>
                        {/* Dynamic Island */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-2.5 bg-zinc-950 z-10 flex items-center justify-center gap-1.5" style={{ width: 72, height: 22, borderRadius: 12 }}>
                          <div className="w-2 h-2 rounded-full bg-zinc-800" />
                          <div className="w-[5px] h-[5px] rounded-full bg-zinc-700/60" />
                        </div>
                        {/* Signal + battery */}
                        <div className="flex items-center gap-1">
                          <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                            <rect x="0" y="5.5" width="1.8" height="2.5" rx="0.4" fill="#18181b"/>
                            <rect x="2.3" y="3.5" width="1.8" height="4.5" rx="0.4" fill="#18181b"/>
                            <rect x="4.6" y="1.5" width="1.8" height="6.5" rx="0.4" fill="#18181b"/>
                            <rect x="6.9" y="0" width="1.8" height="8" rx="0.4" fill="#18181b"/>
                          </svg>
                          <svg width="17" height="9" viewBox="0 0 17 9" fill="none">
                            <rect x="0.5" y="0.5" width="13" height="8" rx="2" stroke="#52525b" strokeWidth="0.8"/>
                            <rect x="1.8" y="1.8" width="9" height="5.4" rx="1" fill="#18181b"/>
                            <path d="M14.5 3v3a1.5 1.5 0 0 0 0-3z" fill="#52525b"/>
                          </svg>
                        </div>
                      </div>

                      {/* App header bar */}
                      <div
                        className="shrink-0 px-4 py-2 flex items-center justify-between border-b"
                        style={{ borderColor: 'rgba(0,0,0,0.07)', backgroundColor: theme.backgroundColor }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: theme.primaryColor }}
                          >
                            <div className="w-1.5 h-1.5 bg-white rounded-sm" />
                          </div>
                          <span className="text-[9px] font-bold text-zinc-900 uppercase tracking-tight truncate">
                            {theme.appLabel}
                          </span>
                        </div>
                        {theme.showBanner && (
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[7px] font-bold text-emerald-600 uppercase tracking-wide">Live</span>
                          </div>
                        )}
                      </div>

                      {/* Scrollable app content container */}
                      <div
                        className="flex-1 flex flex-col min-h-0 transition-colors duration-300"
                        style={{ backgroundColor: theme.backgroundColor }}
                      >
                        {!currentBlock ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 gap-2">
                            <span className="text-2xl opacity-30">📱</span>
                            <p className="text-[9px] text-zinc-400 leading-relaxed font-medium">
                              Add a screen on the left to begin your app
                            </p>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {currentBlock.blockTypeId === "chat" && (
                              <div className="flex-1 flex flex-col min-h-0 px-3 pb-3">
                                <ChatThread blockId={currentBlock.id} />
                              </div>
                            )}
                            {currentBlock.blockTypeId === "search" && (
                              <div className="flex-1 flex flex-col min-h-0">
                                <div className="px-3 pt-3 shrink-0">
                                  <SearchBar blockId={currentBlock.id} inputKey="query" />
                                </div>
                                <div className="flex-1 overflow-y-auto px-3 pb-3 mt-3 min-h-0">
                                  <SourceAccordion blockId={currentBlock.id} outputKey="sources" layout="list" theme="card" hiddenWhenEmpty />
                                </div>
                              </div>
                            )}
                            {currentBlock.blockTypeId === "generate" && (
                              <div className="flex-1 flex flex-col min-h-0 px-3 pb-3">
                                <ChatThread blockId={currentBlock.id} />
                              </div>
                            )}

                            {currentBlock && currentBlock.chainingTarget && (
                              <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100/50 rounded-lg text-[9px] font-semibold text-emerald-700 mx-1">
                                <span>⛓️</span>
                                <span className="truncate">→ <b>{activeBlocks.find(b => b.id === currentBlock.chainingTarget?.blockId)?.name || "Next Screen"}</b></span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Home indicator */}
                      <div
                        className="shrink-0 flex items-center justify-center py-2"
                        style={{ backgroundColor: theme.backgroundColor }}
                      >
                        <div className="h-[4px] w-[72px] rounded-full bg-zinc-800/70" />
                      </div>
                    </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Deploy Modal */}
      {showDeploy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-zinc-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold tracking-tight">Deploy Copilot</h2>
                <button onClick={() => setShowDeploy(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors text-sm">✕</button>
              </div>
              <div className="flex bg-zinc-100 p-1 rounded-xl mb-5">
                <button
                  onClick={() => { setDeployTab("notebook"); setCopied(false); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${deployTab === "notebook" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                >🔗 Notebook Link</button>
                <button
                  onClick={() => { setDeployTab("widget"); setCopied(false); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${deployTab === "widget" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                >{"</>"} Embed Widget</button>
              </div>

              {deployTab === "notebook" && (
                <div className="animate-in fade-in duration-200">
                  <p className="text-sm text-zinc-500 mb-4 leading-relaxed">Anyone with this link can use your co-pilot as a standalone app.</p>
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex items-center gap-3 mb-5">
                    <code className="text-xs font-mono text-zinc-600 truncate flex-1">{previewUrl}</code>
                    <button onClick={() => handleCopy(previewUrl)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${copied ? "bg-emerald-500 text-white" : "bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50"}`}>
                      {copied ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                  <Link href={previewUrl} target="_blank" className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all">
                    Open Preview →
                  </Link>
                </div>
              )}

              {deployTab === "widget" && (
                <div className="animate-in fade-in duration-200">
                  <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
                    Paste anywhere on your site — <code className="font-mono bg-zinc-100 px-1 rounded text-xs">{"<head>"}</code>, <code className="font-mono bg-zinc-100 px-1 rounded text-xs">{"<body>"}</code>, or via Google Tag Manager.
                  </p>
                  <div className="bg-zinc-950 rounded-2xl p-4 mb-3">
                    <pre className="text-emerald-400 text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all select-all">{embedSnippet}</pre>
                  </div>
                  <button onClick={() => handleCopy(embedSnippet)} className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${copied ? "bg-emerald-500 text-white" : "bg-zinc-900 text-white hover:bg-black"}`}>
                    {copied ? "✓ Copied to clipboard" : "Copy Embed Code"}
                  </button>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {["Webflow", "WordPress", "Shopify"].map(p => (
                      <div key={p} className="text-center py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl">
                        <div className="text-[10px] font-bold text-zinc-500">{p}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400 text-center mt-2">Works on any platform that supports custom scripts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
