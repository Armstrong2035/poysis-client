"use client";

import { FileUploader } from "../ui/input/FileUploader";
import { ChatInput } from "../ui/input/ChatInput";
import { SearchBar } from "../ui/input/SearchBar";
import { StreamPanel } from "../ui/display/StreamPanel";
import { SourceAccordion } from "../ui/display/SourceAccordion";
import { VariableList } from "../ui/input/VariableList";
import type { ActiveBlock } from "../../types/canvas";

interface BlockCardProps {
  block: ActiveBlock;
  blocks: Record<string, any>;
  tab: "preview" | "settings";
  activePicker: string | null;
  onTabChange: (tab: "preview" | "settings") => void;
  onToggle: () => void;
  onRemove: () => void;
  onRename: (name: string) => void;
  onToggleSource: (type: string) => void;
  onToggleUploadFormat: (format: string) => void;
  onSetInputInterface: (intf: "chat" | "search" | "none") => void;
  onSetOutputStyle: (style: "looped" | "result" | "agent") => void;
  onSetResultConfig: (key: "layout" | "style", value: any) => void;
  onSetTemplatedInput: (inputKey: string, template: string) => void;
  onPickerToggle: () => void;
}

const BLOCK_EMOJI: Record<string, string> = {
  prompt_wrapper: "🧠",
  retrieval: "📄",
};

export function BlockCard({
  block,
  blocks,
  tab,
  activePicker,
  onTabChange,
  onToggle,
  onRemove,
  onRename,
  onToggleSource,
  onToggleUploadFormat,
  onSetInputInterface,
  onSetOutputStyle,
  onSetResultConfig,
  onSetTemplatedInput,
  onPickerToggle,
}: BlockCardProps) {
  const emoji = BLOCK_EMOJI[block.blockTypeId] || "🔧";

  return (
    <div className="relative mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 group/blockwrapper">
      {/* Data Flow Node Dot */}
      <div className="absolute left-[-27px] top-[14px] w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)] z-10 hidden sm:block"></div>

      {/* Header Row */}
      <div className="group flex items-center w-full -ml-3 mb-2">
        <div className="flex-1 flex items-center gap-2 py-2 px-3 rounded-xl bg-white/60 hover:bg-white/90 backdrop-blur-md transition-all border border-zinc-200/50 hover:border-zinc-300 shadow-sm hover:shadow-md">
          <button
            onClick={onToggle}
            className="text-zinc-300 hover:text-zinc-500 transition-all duration-200 text-[10px] w-6 h-6 flex items-center justify-center -ml-1"
            style={{ transform: block.expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >▶</button>
          <span className="text-xl leading-none cursor-default pr-1">{emoji}</span>
          <div className="flex-1 relative group/input flex items-center mr-2">
            <input
              type="text"
              className="text-base font-semibold text-zinc-800 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-100 hover:bg-black/5 rounded px-1.5 py-0.5 -ml-1.5 w-full min-w-0 transition-colors peer cursor-text"
              value={block.name}
              onChange={(e) => onRename(e.target.value)}
              placeholder="Name this block..."
            />
            <span className="opacity-0 group-hover/input:opacity-40 peer-focus:opacity-0 transition-opacity absolute right-2 pointer-events-none text-[10px]">✎</span>
          </div>
          <span className="ml-auto text-[10px] font-semibold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap cursor-pointer select-none px-2" onClick={onToggle}>
            {block.expanded ? "Collapse" : "Expand"}
          </span>
        </div>
        <button onClick={onRemove} className="p-2 ml-1 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" title="Delete Block">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
        </button>
      </div>

      {block.expanded && (
        <div className="ml-8 mt-2 mb-12 border-l-2 border-zinc-100 pl-6 pb-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Tab Bar */}
          <div className="flex items-center gap-1 mb-8 border-b border-zinc-200 pb-px">
            <button onClick={() => onTabChange("preview")} className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${tab === "preview" ? "border-blue-500 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}>
              Composability Canvas
            </button>
            <button onClick={() => onTabChange("settings")} className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${tab === "settings" ? "border-zinc-500 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}>
              Block Parameters
            </button>
          </div>

          {/* Preview Tab */}
          {(block.blockTypeId === "retrieval" || block.blockTypeId === "prompt_wrapper") && tab === "preview" && (
            <div className="space-y-10 animate-in fade-in duration-300">
              {/* Sources */}
              {block.blockTypeId === "retrieval" ? (
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="text-blue-500">◆</span> Data Logic (Sources)
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button onClick={() => onToggleSource("static")} className={`p-4 border rounded-xl flex flex-col items-start gap-2 text-left transition-all ${block.sources.includes("static") ? "border-blue-400 bg-blue-50 text-blue-900 shadow-sm" : "border-zinc-200 bg-white hover:border-blue-200 hover:bg-blue-50/30"}`}>
                      <span className="text-xl">🗄️</span>
                      <div><div className="text-sm font-semibold">Workspace Library</div><div className="text-[10px] opacity-70 mt-0.5">Connect existing folders</div></div>
                    </button>
                    <button onClick={() => onToggleSource("user_upload")} className={`p-4 border rounded-xl flex flex-col items-start gap-2 text-left transition-all ${block.sources.includes("user_upload") ? "border-blue-400 bg-blue-50 text-blue-900 shadow-sm" : "border-zinc-200 bg-white hover:border-blue-200 hover:bg-blue-50/30"}`}>
                      <span className="text-xl">📄</span>
                      <div><div className="text-sm font-semibold">User Upload Zone</div><div className="text-[10px] opacity-70 mt-0.5">Let users drop files</div></div>
                    </button>
                  </div>
                  {block.sources.includes("user_upload") && (
                    <div className="mt-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                      <label className="text-xs font-semibold text-zinc-700 mb-2 block">Accepted Data Formats</label>
                      <div className="flex gap-2 w-full">
                        <button onClick={() => onToggleUploadFormat("pdf")} className={`flex-1 px-3 py-2 text-xs font-semibold rounded transition-colors ${block.uploadFormats?.includes("pdf") ? "bg-zinc-800 text-white shadow-sm" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"}`}>PDF Documents</button>
                        <button onClick={() => onToggleUploadFormat("spreadsheet")} className={`flex-1 px-3 py-2 text-xs font-semibold rounded transition-colors ${block.uploadFormats?.includes("spreadsheet") ? "bg-zinc-800 text-white shadow-sm" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"}`}>Spreadsheets</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 border border-zinc-200 bg-zinc-50 rounded-xl text-center shadow-sm">
                  <div className="text-3xl mb-3 opacity-80">🧠</div>
                  <div className="text-sm font-bold text-zinc-800">Direct AI Prompt</div>
                  <div className="text-xs font-medium text-zinc-500 mt-1.5 max-w-sm mx-auto leading-relaxed">This block type bypasses the vector knowledge base.</div>
                </div>
              )}

              {/* Query Interface */}
              <div className="mt-8">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="text-emerald-500">◆</span> Query Interface
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button onClick={() => onSetInputInterface("chat")} className={`p-4 border rounded-xl flex flex-col items-start gap-2 text-left transition-all ${block.inputInterface === "chat" ? "border-emerald-400 bg-emerald-50 text-emerald-900 shadow-sm" : "border-zinc-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30"}`}>
                    <span className="text-xl">💬</span>
                    <div><div className="text-sm font-semibold">Chat Input</div><div className="text-[10px] opacity-70 mt-0.5">Conversational messaging</div></div>
                  </button>
                  <button onClick={() => onSetInputInterface("search")} className={`p-4 border rounded-xl flex flex-col items-start gap-2 text-left transition-all ${block.inputInterface === "search" ? "border-emerald-400 bg-emerald-50 text-emerald-900 shadow-sm" : "border-zinc-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30"}`}>
                    <span className="text-xl">🔍</span>
                    <div><div className="text-sm font-semibold">Search Bar</div><div className="text-[10px] opacity-70 mt-0.5">Single-shot query</div></div>
                  </button>
                </div>
              </div>

              {/* Output Form */}
              <div className="mt-8">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="text-purple-500">◆</span> Output Form
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button onClick={() => onSetOutputStyle("looped")} className={`p-4 border rounded-xl flex flex-col items-start gap-2 text-left transition-all ${block.outputStyle === "looped" ? "border-purple-400 bg-purple-50 text-purple-900 shadow-sm" : "border-zinc-200 bg-white hover:border-purple-200 hover:bg-purple-50/30"}`}>
                    <span className="text-xl">🔄</span>
                    <div><div className="text-sm font-semibold">Chat Stream</div><div className="text-[10px] opacity-70 mt-0.5">Interactive flow</div></div>
                  </button>
                  <button onClick={() => onSetOutputStyle("result")} className={`p-4 border rounded-xl flex flex-col items-start gap-2 text-left transition-all ${block.outputStyle === "result" ? "border-purple-400 bg-purple-50 text-purple-900 shadow-sm" : "border-zinc-200 bg-white hover:border-purple-200 hover:bg-purple-50/30"}`}>
                    <span className="text-xl">📑</span>
                    <div><div className="text-sm font-semibold">Result UI</div><div className="text-[10px] opacity-70 mt-0.5">Grids or accordions</div></div>
                  </button>
                  <button onClick={() => onSetOutputStyle("agent")} className={`p-4 border rounded-xl flex flex-col items-start gap-2 text-left transition-all ${block.outputStyle === "agent" ? "border-purple-400 bg-purple-50 text-purple-900 shadow-sm" : "border-zinc-200 bg-white hover:border-purple-200 hover:bg-purple-50/30"}`}>
                    <span className="text-xl">🤖</span>
                    <div><div className="text-sm font-semibold">Agent Pass</div><div className="text-[10px] opacity-70 mt-0.5">Invisible handoff</div></div>
                  </button>
                </div>
                {block.outputStyle === "result" && (
                  <div className="mt-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-semibold text-zinc-700 mb-2 block">Visualization</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-bold text-zinc-500 mb-1">Layout</div>
                        <div className="flex gap-1">
                          <button onClick={() => onSetResultConfig("layout", "list")} className={`flex-1 py-1 text-xs rounded ${block.resultLayout !== "grid" ? "bg-zinc-800 text-white" : "bg-white border border-zinc-200"}`}>List</button>
                          <button onClick={() => onSetResultConfig("layout", "grid")} className={`flex-1 py-1 text-xs rounded ${block.resultLayout === "grid" ? "bg-zinc-800 text-white" : "bg-white border border-zinc-200"}`}>Grid</button>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-zinc-500 mb-1">Theme</div>
                        <div className="flex gap-1">
                          <button onClick={() => onSetResultConfig("style", "card")} className={`flex-1 py-1 text-xs rounded ${block.resultStyle !== "box" ? "bg-zinc-800 text-white" : "bg-white border border-zinc-200"}`}>Card</button>
                          <button onClick={() => onSetResultConfig("style", "box")} className={`flex-1 py-1 text-xs rounded ${block.resultStyle === "box" ? "bg-zinc-800 text-white" : "bg-white border border-zinc-200"}`}>Box</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {(block.blockTypeId === "retrieval" || block.blockTypeId === "prompt_wrapper") && tab === "settings" && (
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-6 flex items-center gap-2 mt-2">
                <span>⚙️</span> Engine Hyperparameters
              </div>
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 mb-2 block">Foundation Model</label>
                  <select className="w-full text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none">
                    <option>Gemini 3 Flash</option>
                    <option>GPT-4o</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-zinc-100 pt-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-zinc-700 block font-mono">System Instructions</label>
                  <div className="relative">
                    <button
                      onClick={onPickerToggle}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 transition-colors flex items-center gap-1"
                    >
                      <span>{`{ }`}</span> Insert Variable
                    </button>
                    {activePicker && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <VariableList
                          currentBlockId={block.id}
                          onSelect={(variable) => {
                            const currentTemplate = (blocks[block.id]?.inputBindings?.instructions as any)?.template || "";
                            onSetTemplatedInput("instructions", currentTemplate + variable);
                            onPickerToggle();
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <textarea
                  className="w-full text-sm bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none font-mono h-32 leading-relaxed focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  value={(blocks[block.id]?.inputBindings?.instructions as any)?.template || ""}
                  onChange={(e) => onSetTemplatedInput("instructions", e.target.value)}
                  placeholder="Use {{ variable }} to inject data..."
                ></textarea>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-400">ID:</span>
                  <code className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 font-mono border border-zinc-200">{block.slug}</code>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
