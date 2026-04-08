"use client";

import { useNotebookStore } from "../../store/notebookStore";
import { SearchBar } from "../../components/ui/input/SearchBar";
import { SourceAccordion } from "../../components/ui/display/SourceAccordion";
import { ChatThread } from "../../components/ui/display/ChatThread";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useHydrated } from "../../hooks/useHydrated";
import { useSearchParams } from "next/navigation";
// getPublicNotebook removed — now fetched via /api/notebook/public

function PreviewContent() {
  const { activeBlocks, hydrateStore, activePreviewBlockId, setActivePreviewBlock, setNotebookId, theme, appScreens } = useNotebookStore();
  const hydrated = useHydrated();
  const searchParams = useSearchParams();
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTab, setShareTab] = useState<"link" | "embed">("link");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const notebookId = searchParams.get("id");
  const isEmbed = searchParams.get("embed") === "true";

  useEffect(() => {
    async function loadNotebook() {
      if (!notebookId) return;
      setNotebookId(notebookId);
      // Only fetch if the store is empty (fresh load or direct URL hit)
      if (activeBlocks.length === 0) {
        setLoading(true);
        try {
          const res = await fetch(`/api/notebook/public?id=${notebookId}`);
          if (!res.ok) throw new Error(`Failed to fetch notebook: ${res.status}`);
          const data = await res.json();
          if (data?.config) hydrateStore(data.config, data.name);
        } catch (err) {
          console.error("Failed to load preview:", err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadNotebook();
  }, [notebookId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/preview?id=${notebookId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const screenIds = appScreens.length > 0 ? appScreens : activeBlocks.map(b => b.id);
  const screenBlocks = screenIds.map(id => activeBlocks.find(b => b.id === id)).filter(Boolean) as typeof activeBlocks;
  const currentBlockId = activePreviewBlockId && screenIds.includes(activePreviewBlockId)
    ? activePreviewBlockId
    : screenIds[0] || null;
  const currentBlock = activeBlocks.find(b => b.id === currentBlockId) || null;
  const parentBlock = screenBlocks[screenBlocks.findIndex(b => b.id === currentBlockId) - 1] || null;

  const isChatLike = currentBlock?.blockTypeId === "chat" || currentBlock?.blockTypeId === "generate";

  if (!hydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-[3px] border-t-transparent animate-spin rounded-full" style={{ borderColor: `${theme.primaryColor} transparent transparent transparent` }} />
          <p className="text-sm text-zinc-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Embed mode: fill the iframe, no Poysis chrome ──────────────────────
  if (isEmbed) {
    return (
      <div
        className={`flex flex-col h-screen overflow-hidden ${theme.fontFamily}`}
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <style jsx global>{`
          :root {
            --primary-color: ${theme.primaryColor};
            --app-bg: ${theme.backgroundColor};
            --radius: ${theme.borderRadius};
            --border-width: ${theme.borderWidth};
            --shadow: ${theme.boxShadow};
          }
          body { margin: 0; }
        `}</style>

        {/* Minimal header — just the app label, no share/builder links */}
        <div
          className="shrink-0 px-4 py-3 flex items-center gap-2 border-b"
          style={{ borderColor: "rgba(0,0,0,0.07)", backgroundColor: theme.backgroundColor }}
        >
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: theme.primaryColor }}>
            <div className="w-1.5 h-1.5 bg-white rounded-sm" />
          </div>
          <span className="text-xs font-bold text-zinc-900 uppercase tracking-tight truncate">{theme.appLabel}</span>
          {theme.showBanner && (
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Live</span>
            </div>
          )}
        </div>

        {/* Content — fills remaining height */}
        <div className="flex-1 flex flex-col min-h-0">
          {!currentBlock ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-8 opacity-50">
              <span className="text-3xl">🌑</span>
              <p className="text-sm font-bold text-zinc-900">No screens configured</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {currentBlock.blockTypeId === "chat" && (
                <div className="flex-1 flex flex-col min-h-0 px-4 pb-4 pt-2">
                  <ChatThread blockId={currentBlock.id} />
                </div>
              )}
              {currentBlock.blockTypeId === "generate" && (
                <div className="flex-1 flex flex-col min-h-0 px-4 pb-4 pt-2">
                  <ChatThread blockId={currentBlock.id} />
                </div>
              )}
              {currentBlock.blockTypeId === "search" && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="px-4 pt-4 shrink-0">
                    <SearchBar blockId={currentBlock.id} inputKey="query" />
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pb-4 mt-4 min-h-0">
                    <SourceAccordion blockId={currentBlock.id} outputKey="sources" layout="list" theme="card" hiddenWhenEmpty />
                  </div>
                </div>
              )}
              {currentBlock.chainingTarget && (
                <button
                  onClick={() => setActivePreviewBlock(currentBlock.chainingTarget!.blockId)}
                  className="mx-4 mb-4 py-3 text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 shrink-0"
                  style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}
                >
                  Continue → {activeBlocks.find(b => b.id === currentBlock.chainingTarget?.blockId)?.name || "Next"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Standalone preview ───────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col items-center justify-start py-0 md:py-10 transition-colors duration-500 ${theme.fontFamily}`}
      style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
    >
      {/* CSS variable injection */}
      <style jsx global>{`
        :root {
          --primary-color: ${theme.primaryColor};
          --app-bg: ${theme.backgroundColor};
          --radius: ${theme.borderRadius};
          --border-width: ${theme.borderWidth};
          --shadow: ${theme.boxShadow};
        }
      `}</style>

      {/* Phone card — centered, narrow, full-height on mobile */}
      <div
        className="w-full md:max-w-[430px] flex flex-col md:rounded-[40px] md:shadow-2xl overflow-hidden relative"
        style={{
          backgroundColor: theme.backgroundColor,
          minHeight: "100dvh",
          maxHeight: "100dvh",
        }}
      >
        {/* Status bar (desktop only — mimics phone chrome) */}
        <div className="hidden md:flex shrink-0 px-6 pt-4 pb-1 items-center justify-between" style={{ backgroundColor: theme.backgroundColor }}>
          <span className="text-[11px] font-bold text-zinc-800" style={{ letterSpacing: "-0.02em" }}>9:41</span>
          <div className="flex items-center gap-1.5">
            <svg width="13" height="10" viewBox="0 0 11 8" fill="none">
              <rect x="0" y="5.5" width="1.8" height="2.5" rx="0.4" fill="#18181b"/>
              <rect x="2.3" y="3.5" width="1.8" height="4.5" rx="0.4" fill="#18181b"/>
              <rect x="4.6" y="1.5" width="1.8" height="6.5" rx="0.4" fill="#18181b"/>
              <rect x="6.9" y="0" width="1.8" height="8" rx="0.4" fill="#18181b"/>
            </svg>
            <svg width="20" height="10" viewBox="0 0 17 9" fill="none">
              <rect x="0.5" y="0.5" width="13" height="8" rx="2" stroke="#52525b" strokeWidth="0.8"/>
              <rect x="1.8" y="1.8" width="9" height="5.4" rx="1" fill="#18181b"/>
              <path d="M14.5 3v3a1.5 1.5 0 0 0 0-3z" fill="#52525b"/>
            </svg>
          </div>
        </div>

        {/* App header */}
        <div
          className="shrink-0 px-5 py-3 flex items-center justify-between border-b"
          style={{ borderColor: "rgba(0,0,0,0.07)", backgroundColor: theme.backgroundColor }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <div className="w-2 h-2 bg-white rounded-sm" />
            </div>
            <span className="text-sm font-bold text-zinc-900 uppercase tracking-tight truncate">
              {theme.appLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {theme.showBanner && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Live</span>
              </div>
            )}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80"
              style={{ backgroundColor: theme.primaryColor, color: "white", borderRadius: theme.borderRadius }}
            >
              Share
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {!currentBlock ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-8 opacity-50">
              <span className="text-4xl">🌑</span>
              <div>
                <p className="font-bold text-zinc-900">No screens configured</p>
                <p className="text-sm text-zinc-500 mt-1">Go back to the builder and add blocks to your app.</p>
              </div>
              <Link href={`/notebook?id=${notebookId || ""}`} className="text-sm font-bold text-blue-600 hover:underline mt-2">
                Return to Builder
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {parentBlock && (
                <button
                  onClick={() => setActivePreviewBlock(parentBlock.id)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors mb-4 px-5 pt-4"
                >
                  ← {parentBlock.name}
                </button>
              )}

              {currentBlock.blockTypeId === "chat" && (
                <div className="flex-1 flex flex-col min-h-0 px-4 pb-4">
                  <ChatThread blockId={currentBlock.id} />
                </div>
              )}
              {currentBlock.blockTypeId === "generate" && (
                <div className="flex-1 flex flex-col min-h-0 px-4 pb-4">
                  <ChatThread blockId={currentBlock.id} />
                </div>
              )}
              {currentBlock.blockTypeId === "search" && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="px-5 pt-5 shrink-0">
                    <SearchBar blockId={currentBlock.id} inputKey="query" />
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 pb-5 mt-5 min-h-0">
                    <SourceAccordion blockId={currentBlock.id} outputKey="sources" layout="list" theme="card" hiddenWhenEmpty />
                  </div>
                </div>
              )}

              {currentBlock.chainingTarget && (
                <button
                  onClick={() => setActivePreviewBlock(currentBlock.chainingTarget!.blockId)}
                  className="mx-5 mb-5 mt-4 py-3.5 text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-md shrink-0 flex items-center justify-center gap-2"
                  style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}
                >
                  Continue → {activeBlocks.find(b => b.id === currentBlock.chainingTarget?.blockId)?.name || "Next"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Home indicator */}
        <div className="hidden md:flex shrink-0 items-center justify-center py-3" style={{ backgroundColor: theme.backgroundColor }}>
          <div className="h-1 w-20 rounded-full bg-zinc-800/50" />
        </div>
      </div>

      {/* Return to builder — floating, outside the card */}
      <Link
        href={`/notebook?id=${notebookId || ""}`}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-zinc-900 text-white rounded-full text-xs font-bold shadow-2xl hover:bg-zinc-800 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 z-50 group"
      >
        <span className="group-hover:rotate-12 transition-transform">🛠️</span> Return to Builder
      </Link>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-zinc-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold tracking-tight">Deploy Copilot</h2>
                <button onClick={() => setShowShareModal(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors text-sm">✕</button>
              </div>

              {/* Tab bar */}
              <div className="flex bg-zinc-100 p-1 rounded-xl mb-5">
                <button
                  onClick={() => { setShareTab("link"); setCopied(false); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${shareTab === "link" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                >
                  🔗 Share Link
                </button>
                <button
                  onClick={() => { setShareTab("embed"); setCopied(false); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${shareTab === "embed" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                >
                  {"<>"} Embed Widget
                </button>
              </div>

              {/* Link tab */}
              {shareTab === "link" && (
                <div className="animate-in fade-in duration-200">
                  <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
                    Anyone with this link can use your co-pilot as a standalone app.
                  </p>
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex items-center gap-3 mb-5">
                    <code className="text-xs font-mono text-zinc-600 truncate flex-1">
                      {typeof window !== "undefined" ? window.location.origin : "https://poysis.app"}/preview?id={notebookId}
                    </code>
                    <button
                      onClick={handleCopy}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${copied ? "bg-emerald-500 text-white" : "bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50"}`}
                    >
                      {copied ? "✓ Copied" : "Copy"}
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
              )}

              {/* Embed tab */}
              {shareTab === "embed" && (
                <div className="animate-in fade-in duration-200">
                  <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
                    Paste this script tag anywhere on your website — in the <code className="font-mono bg-zinc-100 px-1 rounded text-xs">{"<head>"}</code>, <code className="font-mono bg-zinc-100 px-1 rounded text-xs">{"<body>"}</code>, or via Google Tag Manager.
                  </p>

                  {/* Code snippet */}
                  <div className="bg-zinc-950 rounded-2xl p-4 mb-3 relative group">
                    <pre className="text-emerald-400 text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all select-all">{`<script
  src="${typeof window !== "undefined" ? window.location.origin : "https://poysis.app"}/embed.js"
  data-notebook-id="${notebookId}"
  data-label="Ask us anything"
  data-color="${theme.primaryColor}"
  async>
</script>`}</pre>
                  </div>

                  <button
                    onClick={() => {
                      const snippet = `<script\n  src="${typeof window !== "undefined" ? window.location.origin : "https://poysis.app"}/embed.js"\n  data-notebook-id="${notebookId}"\n  data-label="Ask us anything"\n  data-color="${theme.primaryColor}"\n  async>\n</script>`;
                      navigator.clipboard.writeText(snippet);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${copied ? "bg-emerald-500 text-white" : "bg-zinc-900 text-white hover:bg-zinc-800"}`}
                  >
                    {copied ? "✓ Copied to clipboard" : "Copy Embed Code"}
                  </button>

                  {/* Install hints */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {["Webflow", "WordPress", "Shopify"].map(platform => (
                      <div key={platform} className="text-center py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl">
                        <div className="text-[10px] font-bold text-zinc-500">{platform}</div>
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
