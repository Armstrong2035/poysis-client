"use client";

import { useState, useEffect, useRef } from "react";
import { useNotebookStore } from "../../../store/notebookStore";
import { useHydrated } from "../../../hooks/useHydrated";
import { saveNotebook } from "../../../lib/actions";
import type { User } from "@supabase/supabase-js";

import { NotebookSidebar } from "../../../components/notebook/NotebookSidebar";
import { AppComposer } from "../../../components/notebook/AppComposer";
import { BlockPickerModal } from "../../../components/notebook/BlockPickerModal";
import { ConfigHubModal } from "../../../components/notebook/ConfigHubModal";
import { BlockCard } from "../../../components/notebook/BlockCard";
import { BlockDetailPanel } from "../../../components/notebook/BlockDetailPanel";

interface NotebookClientProps {
  id?: string;
  initialData?: any;
  user: User;
}

export default function NotebookClient({ id, initialData, user }: NotebookClientProps) {
  const hydrated = useHydrated();

  const {
    activeBlocks,
    addBlock: storeAddBlock,
    renameBlock,
    toggleSource,
    removeBlock,
    blocks,
    setTemplatedInput,
    setChainingTarget,
    resetStore,
    uiComponents,
    hydrateStore,
    setNotebookId,
    appScreens,
    addToApp,
    removeFromApp,
    theme,
    setStateSetting,
    setBlockUIConfig,
  } = useNotebookStore();

  const [notebookTitle, setNotebookTitle] = useState(initialData?.name || "Untitled Notebook");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [showConfigHub, setShowConfigHub] = useState(false);
  const [showComposer, setShowComposer] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const selectedBlock = activeBlocks.find(b => b.id === selectedBlockId) || null;

  const [isHydrationComplete, setIsHydrationComplete] = useState(false);
  const hasHydratedForId = useRef<string | null>(null);

  useEffect(() => {
    const notebookId = id || initialData?.id;
    if (notebookId && hasHydratedForId.current === notebookId) return;

    if (notebookId) {
      setNotebookId(notebookId);
      hasHydratedForId.current = notebookId;
    }

    if (initialData?.config) {
      hydrateStore(initialData.config, initialData.name);
      setLastSaved(new Date(initialData.updated_at || initialData.created_at));
      setTimeout(() => setIsHydrationComplete(true), 100);
    } else {
      setIsHydrationComplete(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, initialData?.id]);

  useEffect(() => {
    if (!isHydrationComplete) return;

    const targetId = id || initialData?.id;
    if (!targetId) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveNotebook(targetId, {
          name: notebookTitle,
          activeBlocks,
          blocks,
          uiComponents,
          appScreens,
          theme,
        });
        setLastSaved(new Date());
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBlocks, blocks, uiComponents, appScreens, theme, notebookTitle, isHydrationComplete]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const targetId = id || initialData?.id || "default-notebook";
      await saveNotebook(targetId, { name: notebookTitle, activeBlocks, blocks, uiComponents, appScreens, theme });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBlock = (blockTypeId: string) => {
    storeAddBlock(blockTypeId);
    setShowBlockPicker(false);
    setTimeout(() => {
      const allBlocks = useNotebookStore.getState().activeBlocks;
      const newest = allBlocks[allBlocks.length - 1];
      if (newest) setSelectedBlockId(newest.id);
    }, 50);
  };

  if (!hydrated) return null;

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ background: "#0A0B0F", color: "#E8E9ED" }}
    >
      {/* Gold dot grid */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(rgba(232,165,71,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Left Sidebar */}
      <NotebookSidebar
        user={user}
        onConfigOpen={() => setShowConfigHub(true)}
        notebookTitle={notebookTitle}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onTitleChange={setNotebookTitle}
        onSave={handleSave}
      />

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto relative flex flex-col z-10 transition-all duration-300 ${showComposer ? "min-w-[360px]" : "min-w-0"}`}>
        <div className={`max-w-2xl mx-auto pt-10 pb-24 w-full transition-all duration-300 ${showComposer ? "px-4" : "px-8"}`}>

          {/* Document Header */}
          <div className="mb-12">
            <input
              type="text"
              value={notebookTitle}
              onChange={(e) => setNotebookTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              className="w-full outline-none bg-transparent rounded-xl -ml-4 px-4 py-2 transition-all border border-transparent"
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#E8E9ED",
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = "rgba(58,61,71,0.15)";
                e.currentTarget.style.borderColor = "rgba(232,165,71,0.25)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
                handleSave();
              }}
            />
            <p
              className="-ml-4 px-4 mt-2"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", letterSpacing: "0.15em", color: "#3A3D47", textTransform: "uppercase" }}
            >
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Empty State */}
          {activeBlocks.length === 0 && (
            <div className="text-center py-24" style={{ opacity: 0.5 }}>
              <div className="flex justify-center mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(232,165,71,0.08)", border: "1px solid rgba(232,165,71,0.15)" }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#E8A547" strokeWidth="1.3">
                    <rect x="2" y="2" width="18" height="18" rx="3" />
                    <line x1="11" y1="7" x2="11" y2="15" />
                    <line x1="7" y1="11" x2="15" y2="11" />
                  </svg>
                </div>
              </div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: "15px", fontWeight: 700, color: "#E8E9ED", marginBottom: "6px" }}>
                No blocks yet
              </div>
              <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC" }}>
                Add a logic block to start building your AI app.
              </div>
            </div>
          )}

          {/* Block Index */}
          <div className="space-y-3">
            {activeBlocks.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                blocks={blocks}
                allBlocks={activeBlocks}
                isInApp={appScreens.includes(block.id)}
                appHasScreens={appScreens.length > 0}
                onClick={() => setSelectedBlockId(block.id)}
                onToggleApp={() =>
                  appScreens.includes(block.id)
                    ? removeFromApp(block.id)
                    : addToApp(block.id)
                }
                onRemove={() => {
                  removeBlock(block.id);
                  if (selectedBlockId === block.id) setSelectedBlockId(null);
                }}
              />
            ))}
          </div>

          {/* Add Block Button */}
          <button
            onClick={() => setShowBlockPicker(true)}
            className="mt-4 w-full group flex items-center justify-center gap-3 cursor-pointer rounded-2xl py-6 transition-all"
            style={{
              border: "2px dashed rgba(232,165,71,0.2)",
              background: "rgba(232,165,71,0.02)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,165,71,0.45)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,165,71,0.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,165,71,0.2)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,165,71,0.02)";
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(58,61,71,0.5)", border: "1px solid rgba(232,165,71,0.2)", color: "#E8A547" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="6" y1="1" x2="6" y2="11" />
                <line x1="1" y1="6" x2="11" y2="6" />
              </svg>
            </div>
            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 400, color: "#9CA0AC" }}>
              {activeBlocks.length === 0 ? "Add your first block…" : "Add another block…"}
            </span>
          </button>
        </div>
      </div>

      {/* Right Panel: App Composer */}
      <AppComposer
        activeBlocks={activeBlocks}
        notebookId={id || initialData?.id}
        isVisible={showComposer}
        onToggle={() => setShowComposer(v => !v)}
      />

      {/* Block Detail Panel */}
      {selectedBlock && (
        <BlockDetailPanel
          block={selectedBlock}
          blocks={blocks}
          allBlocks={activeBlocks}
          isOpen={!!selectedBlockId}
          onClose={() => setSelectedBlockId(null)}
          onRename={(name) => renameBlock(selectedBlock.id, name)}
          onToggleSource={(type) => toggleSource(selectedBlock.id, type)}
          onSetChainingTarget={(target) => setChainingTarget(selectedBlock.id, target)}
          onSetTemplatedInput={(key, tpl) => setTemplatedInput(selectedBlock.id, key, tpl)}
          onSetStateSetting={(key, val) => setStateSetting(selectedBlock.id, key, val)}
          onSetUIConfig={(cfg) => setBlockUIConfig(selectedBlock.id, cfg)}
          onSave={handleSave}
        />
      )}

      {/* Modals */}
      {showConfigHub && (
        <ConfigHubModal
          activeBlocks={activeBlocks}
          blocks={blocks}
          uiComponents={uiComponents}
          onReset={resetStore}
          onClose={() => setShowConfigHub(false)}
        />
      )}
      {showBlockPicker && (
        <BlockPickerModal onAdd={handleAddBlock} onClose={() => setShowBlockPicker(false)} />
      )}
    </div>
  );
}
