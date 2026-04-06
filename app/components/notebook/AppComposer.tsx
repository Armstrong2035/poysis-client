"use client";

import { ChatInput } from "../ui/input/ChatInput";
import { SearchBar } from "../ui/input/SearchBar";
import { StreamPanel } from "../ui/display/StreamPanel";
import { SourceAccordion } from "../ui/display/SourceAccordion";
import type { ActiveBlock } from "../../types/canvas";
import Link from "next/link";

interface AppComposerProps {
  activeBlocks: ActiveBlock[];
  onShiftElement: (blockId: string, index: number, direction: "up" | "down") => void;
  notebookId?: string;
}

export function AppComposer({ activeBlocks, onShiftElement, notebookId }: AppComposerProps) {
  return (
    <div className="w-[450px] 2xl:w-[500px] border-l border-zinc-200/80 bg-[#FAFAFA] flex-col hidden xl:flex shadow-[-4px_0_24px_rgba(0,0,0,0.04)] z-20 h-screen overflow-y-auto sticky top-0 relative shrink-0">
      <div className="p-6 border-b border-zinc-200/80 bg-white sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="font-bold text-sm text-zinc-900 flex items-center gap-2">
          <span className="text-lg leading-none">📱</span> App Composer
        </div>
        {notebookId && (
          <Link
            href={`/preview?id=${notebookId}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-[11px] font-bold shadow-md shadow-black/10 hover:shadow-black/20 hover:-translate-y-px active:translate-y-0 transition-all group"
          >
            <span className="group-hover:rotate-12 transition-transform text-xs">🚀</span> Launch Preview
          </Link>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <div className="text-xs text-zinc-500 mb-4 font-medium">Design how users interact with your logic blocks.</div>
        
        {/* The High-Fidelity Copilot Container */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-md flex-1 flex flex-col relative min-h-0 overflow-hidden">
          
          {/* Deployment Status Banner */}
          <div className="bg-emerald-500 px-4 py-1 flex items-center justify-center gap-2">
            <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>
            <span className="text-[8px] font-bold text-white uppercase tracking-widest">Environment: Preview · Ready</span>
          </div>

          {/* Browser Chrome / Header */}
          <div className="px-4 py-3 border-b border-zinc-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-px"></div>
              </div>
              <div className="text-[10px] font-bold text-zinc-900 uppercase tracking-tight">Poysis Copilot</div>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-zinc-200"></div>
              <div className="w-2 h-2 rounded-full bg-zinc-200"></div>
              <div className="w-2 h-2 rounded-full bg-zinc-200"></div>
            </div>
          </div>

          <div className="p-5 bg-white flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            {activeBlocks.length === 0 && (
              <div className="flex-1 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center p-6 text-zinc-400 bg-zinc-50/50">
                <span className="text-3xl mb-3 opacity-60">🧩</span>
                <span className="text-sm font-semibold text-zinc-600 mb-1">Canvas Empty</span>
              </div>
            )}
            {activeBlocks.map((block) => (
              <div key={block.id} className="relative mb-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between border-b border-zinc-100 pb-2">
                  <span className="truncate pr-2">{block.name}</span>
                  <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 flex-shrink-0">Node</span>
                </div>
                {!block.inputInterface && !block.outputStyle ? (
                  <div className="text-xs text-zinc-400 text-center py-6 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">Incomplete Configuration</div>
                ) : (
                  <div className="space-y-6 px-1">
                    {(block.uiOrder || ["source", "input", "output"]).map((type, idx) => {
                      const orderArray = block.uiOrder || ["source", "input", "output"];
                      const wrap = (content: React.ReactNode) => (
                        <div key={type} className="relative group/sorter animate-in fade-in slide-in-from-bottom-1">
                          {content}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/sorter:opacity-100 transition-opacity z-10 scale-90">
                            <button 
                              onClick={() => onShiftElement(block.id, idx, 'up')} 
                              disabled={idx === 0} 
                              className="w-6 h-6 rounded-md bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-700 flex items-center justify-center disabled:opacity-30 shadow-sm transition-all hover:border-black active:scale-90"
                            >
                              ▲
                            </button>
                            <button 
                              onClick={() => onShiftElement(block.id, idx, 'down')} 
                              disabled={idx === orderArray.length - 1} 
                              className="w-6 h-6 rounded-md bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-700 flex items-center justify-center disabled:opacity-30 shadow-sm transition-all hover:border-black active:scale-90"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      );
                      if (type === "input" && block.inputInterface) return wrap(<>{block.inputInterface === "chat" && <ChatInput blockId={block.id} inputKey="query" />}{block.inputInterface === "search" && <SearchBar blockId={block.id} inputKey="query" />}</>);
                      if (type === "output" && block.outputStyle && block.outputStyle !== "agent") return wrap(
                        <>
                          {block.outputStyle === "looped" && (
                            <div className="space-y-4">
                              <StreamPanel blockId={block.id} outputKey="stream" />
                              <SourceAccordion blockId={block.id} outputKey="sources" layout="list" theme="card" hiddenWhenEmpty />
                            </div>
                          )}
                          {block.outputStyle === "result" && <SourceAccordion blockId={block.id} outputKey="sources" layout={block.resultLayout || "list"} theme={block.resultStyle || "card"} />}
                        </>
                      );
                      if (type === "output" && block.outputStyle === "agent") return wrap(<div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center flex flex-col items-center justify-center gap-2 text-indigo-600 shadow-sm"><span className="text-2xl">🤖</span><span className="text-xs font-bold">Variable Handoff</span><span className="text-[10px] opacity-80 max-w-[160px] mx-auto leading-relaxed text-center">Invisible to the user.</span></div>);
                      return null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Copilot Footer Attribution */}
          <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Powered by Poysis</span>
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[8px] font-bold text-zinc-600 uppercase">Live Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
