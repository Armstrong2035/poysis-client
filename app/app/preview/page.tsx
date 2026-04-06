"use client";

import { useNotebookStore } from "../../store/notebookStore";
import { FileUploader } from "../../components/ui/input/FileUploader";
import { ChatInput } from "../../components/ui/input/ChatInput";
import { SearchBar } from "../../components/ui/input/SearchBar";
import { StreamPanel } from "../../components/ui/display/StreamPanel";
import { SourceAccordion } from "../../components/ui/display/SourceAccordion";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useHydrated } from "../../hooks/useHydrated";
import { useSearchParams } from "next/navigation";
import { getNotebook } from "../../lib/actions";

function PreviewContent() {
  const { activeBlocks, name, hydrateStore } = useNotebookStore();
  const hydrated = useHydrated();
  const searchParams = useSearchParams();
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const notebookId = searchParams.get("id");

  useEffect(() => {
    async function loadNotebook() {
      if (!notebookId) return;
      
      // Only fetch if we don't have blocks yet, or we explicitly want to refresh
      if (activeBlocks.length === 0) {
        setLoading(true);
        try {
          const data = await getNotebook(notebookId);
          if (data) {
            hydrateStore(data.config, data.name);
          }
        } catch (err) {
          console.error("Failed to load preview:", err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadNotebook();
  }, [notebookId, activeBlocks.length, hydrateStore]);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hydrated || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
          <p className="text-zinc-500 font-medium animate-pulse">Igniting Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 font-sans selection:bg-blue-100 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/5 blur-[120px]"></div>
      </div>

      {/* Main Preview Container */}
      <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-zinc-200/50 overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-700 h-[85vh] md:h-[800px] relative">
        
        {/* Deployment Status Banner */}
        <div className="bg-emerald-500 px-4 py-1.5 flex items-center justify-center gap-2 group cursor-pointer hover:bg-emerald-600 transition-colors">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Environment: Production · Ready for Traffic</span>
        </div>

        {/* App Header */}
        <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 transition-transform hover:rotate-0">
              <div className="w-3 h-3 bg-white rounded-md"></div>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">{name || "Poysis Copilot"}</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Engine</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-tight">V1.0 Preview</div>
            <button 
              onClick={() => setShowShareModal(true)}
              className="px-4 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold shadow-md hover:bg-black transition-all flex items-center gap-2"
            >
              <span>🔗</span> Share
            </button>
          </div>
        </div>

        {/* Dynamic App Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          {activeBlocks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <span className="text-5xl">🌑</span>
              <div>
                <p className="font-bold text-zinc-900">No Logic Defined</p>
                <p className="text-sm text-zinc-500">Go back to the builder to add blocks.</p>
              </div>
              <Link href={`/notebook?id=${notebookId || ""}`} className="text-sm font-bold text-blue-600 hover:underline">Return to Builder</Link>
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-16 py-8">
              {activeBlocks.map((block) => (
                <div key={block.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-8">
                    {(block.uiOrder || ["source", "input", "output"]).map((type) => {
                      if (type === "source" && block.sources.includes("user_upload")) {
                        return (
                          <div key={`${block.id}-source`} className="transform transition-all hover:scale-[1.01]">
                             <FileUploader blockId={block.id} inputKey="documents" acceptedFormats={block.uploadFormats || ["pdf", "spreadsheet"]} />
                          </div>
                        );
                      }
                      
                      if (type === "input" && block.inputInterface) {
                        return (
                          <div key={`${block.id}-input`} className="transform transition-all hover:scale-[1.01]">
                            {block.inputInterface === "chat" && <ChatInput blockId={block.id} inputKey="query" />}
                            {block.inputInterface === "search" && <SearchBar blockId={block.id} inputKey="query" />}
                          </div>
                        );
                      }

                      if (type === "output" && block.outputStyle && block.outputStyle !== "agent") {
                        return (
                          <div key={`${block.id}-output`} className="transform transition-all">
                            {block.outputStyle === "looped" && <StreamPanel blockId={block.id} outputKey="stream" />}
                            {block.outputStyle === "result" && (
                              <SourceAccordion 
                                blockId={block.id} 
                                outputKey="sources" 
                                layout={block.resultLayout || "list"} 
                                theme={block.resultStyle || "card"} 
                              />
                            )}
                          </div>
                        );
                      }
                      
                      return null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Attribution */}
        <div className="px-8 py-5 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Powered by <span className="text-zinc-600">Poysis Intelligence</span>
          </div>
          <div className="flex gap-4">
             <Link href="#" className="text-[10px] font-bold text-zinc-400 hover:text-black uppercase tracking-tight">Privacy</Link>
             <Link href="#" className="text-[10px] font-bold text-zinc-400 hover:text-black uppercase tracking-tight">Terms</Link>
          </div>
        </div>
      </div>

      {/* Builder Shortcut (Preview Mode Only) */}
      <Link 
        href={`/notebook?id=${notebookId || ""}`}
        className="mt-8 px-6 py-2.5 bg-zinc-900 text-white rounded-full text-xs font-bold shadow-xl hover:bg-zinc-800 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2 z-20 group"
      >
        <span className="group-hover:rotate-12 transition-transform">🛠️</span> Return to Builder
      </Link>

      {/* Share Modal Simulation */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
           <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8">
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold tracking-tight">Share Copilot</h2>
                    <button onClick={() => setShowShareModal(false)} className="text-zinc-400 hover:text-black transition-colors text-2xl leading-none">✕</button>
                 </div>
                 
                 <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                    Your copilot environment is live. Anyone with this link can interact with your logic blocks.
                 </p>
                 
                 <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex items-center justify-between gap-4 mb-8">
                    <code className="text-xs font-mono text-zinc-600 truncate">poysis.app/c/notebook-x192...</code>
                    <button 
                      onClick={handleCopy}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shadow-sm ${copied ? 'bg-emerald-500 text-white' : 'bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50'}`}
                    >
                       {copied ? '✓ Copied' : 'Copy Link'}
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 py-3 bg-sky-50 text-sky-700 rounded-xl text-xs font-bold hover:bg-sky-100 transition-colors">
                       <span>🐦</span> Twitter
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 bg-zinc-100 text-zinc-900 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors">
                       <span>📧</span> Email
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense>
      <PreviewContent />
    </Suspense>
  );
}
