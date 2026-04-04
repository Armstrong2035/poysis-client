"use client";

import { FileUploader } from "../ui/input/FileUploader";
import { ChatInput } from "../ui/input/ChatInput";
import { SearchBar } from "../ui/input/SearchBar";
import { StreamPanel } from "../ui/display/StreamPanel";
import { SourceAccordion } from "../ui/display/SourceAccordion";
import type { ActiveBlock } from "../../types/canvas";

interface AppComposerProps {
  activeBlocks: ActiveBlock[];
}

export function AppComposer({ activeBlocks }: AppComposerProps) {
  return (
    <div className="w-[450px] 2xl:w-[500px] border-l border-zinc-200/80 bg-[#FAFAFA] flex-col hidden xl:flex shadow-[-4px_0_24px_rgba(0,0,0,0.04)] z-20 h-screen overflow-y-auto sticky top-0 relative shrink-0">
      <div className="p-6 border-b border-zinc-200/80 bg-white sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="font-bold text-sm text-zinc-900 flex items-center gap-2">
          <span className="text-lg leading-none">📱</span> App Composer
        </div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-white bg-blue-500 px-2 py-1 rounded shadow-sm">Live Preview</div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <div className="text-xs text-zinc-500 mb-4 font-medium">Design how users interact with your logic blocks.</div>
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-md flex-1 flex flex-col relative min-h-0">
          {/* Browser Chrome */}
          <div className="h-10 border-b border-zinc-100 bg-zinc-50 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
            <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
            <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
          </div>

          <div className="p-5 bg-white flex-1 flex flex-col overflow-y-auto">
            {activeBlocks.length === 0 && (
              <div className="flex-1 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center p-6 text-zinc-400 bg-zinc-50">
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
                        <div key={type} className="relative">{content}</div>
                      );
                      if (type === "source" && block.sources.includes("user_upload")) return wrap(<FileUploader blockId={block.id} inputKey="documents" acceptedFormats={block.uploadFormats || ["pdf", "spreadsheet"]} />);
                      if (type === "input" && block.inputInterface) return wrap(<>{block.inputInterface === "chat" && <ChatInput blockId={block.id} inputKey="query" />}{block.inputInterface === "search" && <SearchBar blockId={block.id} inputKey="query" />}</>);
                      if (type === "output" && block.outputStyle && block.outputStyle !== "agent") return wrap(<>{block.outputStyle === "looped" && <StreamPanel blockId={block.id} outputKey="stream" />}{block.outputStyle === "result" && <SourceAccordion blockId={block.id} outputKey="sources" layout={block.resultLayout || "list"} theme={block.resultStyle || "card"} />}</>);
                      if (type === "output" && block.outputStyle === "agent") return wrap(<div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center flex flex-col items-center justify-center gap-2 text-indigo-600 shadow-sm"><span className="text-2xl">🤖</span><span className="text-xs font-bold">Variable Handoff</span><span className="text-[10px] opacity-80 max-w-[160px] mx-auto leading-relaxed text-center">Invisible to the user.</span></div>);
                      return null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
