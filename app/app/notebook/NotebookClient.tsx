"use client";

import { useState, useEffect, useRef } from "react";
import { useNotebookStore } from "../../store/notebookStore";
import { useHydrated } from "../../hooks/useHydrated";
import { saveNotebook } from "../../lib/actions";
import type { User } from "@supabase/supabase-js";

import { NotebookSidebar } from "../../components/notebook/NotebookSidebar";
import { AppComposer } from "../../components/notebook/AppComposer";
import { BlockPickerModal } from "../../components/notebook/BlockPickerModal";
import { ConfigHubModal } from "../../components/notebook/ConfigHubModal";
import { BlockCard } from "../../components/notebook/BlockCard";
import { BlockDetailPanel } from "../../components/notebook/BlockDetailPanel";

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

  // UI state
  const [notebookTitle, setNotebookTitle] = useState(initialData?.name || "Untitled Notebook");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [showConfigHub, setShowConfigHub] = useState(false);
  const [showComposer, setShowComposer] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const selectedBlock = activeBlocks.find(b => b.id === selectedBlockId) || null;

  // ── Hydration & Save Guard ────────────────
  const [isHydrationComplete, setIsHydrationComplete] = useState(false);
  const hasHydratedForId = useRef<string | null>(null);

  useEffect(() => {
    const notebookId = id || initialData?.id;
    // Only hydrate if we haven't already done so for this specific notebook ID
    if (notebookId && hasHydratedForId.current === notebookId) return;

    if (notebookId) {
      setNotebookId(notebookId);
      hasHydratedForId.current = notebookId;
    }

    if (initialData?.config) {
      hydrateStore(initialData.config, initialData.name);
      setLastSaved(new Date(initialData.updated_at || initialData.created_at));
      // Give the store a moment to propagate before we allow auto-saves
      setTimeout(() => setIsHydrationComplete(true), 100);
    } else {
      // If there's no initial data, we're likely in a 'new' state
      setIsHydrationComplete(true);
    }
    // We intentionally only run this on mount/ID change to avoid overwriting 
    // local state when revalidatePath triggers a background prop update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, initialData?.id]);

  // ── Debounced auto-save (2s after last store change) ────────────────
  // ── Debounced auto-save (2s after last store change) ────────────────
  useEffect(() => {
    // ONLY save after we've finished the initial hydration
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

  // ── Handlers ──────────────────────────────────────────────────────────

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
    // Immediately open the detail panel for the new block
    // The block ID is generated as `${blockTypeId}_${Date.now()}` in addBlock
    // We use a small timeout to let the store update first
    setTimeout(() => {
      const allBlocks = useNotebookStore.getState().activeBlocks;
      const newest = allBlocks[allBlocks.length - 1];
      if (newest) setSelectedBlockId(newest.id);
    }, 50);
  };

  // ── Render ─────────────────────────────────────────────────────────────

  if (!hydrated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-zinc-200 relative">
      {/* Dot Grid Background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60 z-0"></div>

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

      {/* Main Content — Block Index — Focus Mode aware */}
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
              className="w-full text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 outline-none bg-transparent hover:bg-white focus:bg-white focus:shadow-sm rounded-xl -ml-4 px-4 py-2 transition-all border border-transparent focus:border-zinc-200"
            />
            <p className="mt-2 text-zinc-400 text-sm -ml-4 px-4">
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Empty State */}
          {activeBlocks.length === 0 && (
            <div className="text-center py-24 opacity-60">
              <div className="text-5xl mb-4">🧩</div>
              <div className="text-lg font-semibold text-zinc-700 mb-1">No blocks yet</div>
              <div className="text-sm text-zinc-400 mb-6">Add a logic block to start building your AI app.</div>
            </div>
          )}

          {/* Block Index — the list of tiles */}
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
            className="mt-4 w-full group flex items-center justify-center gap-3 cursor-pointer border-2 border-dashed border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 bg-white/50 rounded-2xl py-6 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 text-lg transition-colors group-hover:scale-110">
              +
            </div>
            <span className="text-zinc-400 group-hover:text-zinc-700 text-sm font-semibold transition-colors">
              {activeBlocks.length === 0 ? "Add your first block..." : "Add another block..."}
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

      {/* Block Detail Panel (slide-over) */}
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
