"use client";

import { useState, useEffect } from "react";
import { useNotebookStore } from "../../store/notebookStore";
import { useHydrated } from "../../hooks/useHydrated";
import { saveNotebook } from "../../lib/actions";
import type { User } from "@supabase/supabase-js";

import { NotebookSidebar } from "../../components/notebook/NotebookSidebar";
import { AppComposer } from "../../components/notebook/AppComposer";
import { BlockPickerModal } from "../../components/notebook/BlockPickerModal";
import { ConfigHubModal } from "../../components/notebook/ConfigHubModal";
import { BlockCard } from "../../components/notebook/BlockCard";

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
    toggleBlock,
    toggleSource,
    shiftElementRank,
    setInputInterface,
    setOutputStyle,
    setResultConfig,
    toggleUploadFormat,
    removeBlock,
    blocks,
    setTemplatedInput,
    resetStore,
    uiComponents,
    hydrateStore,
    setNotebookId,
  } = useNotebookStore();

  // UI state
  const [notebookTitle, setNotebookTitle] = useState(initialData?.name || "Untitled Notebook");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [showConfigHub, setShowConfigHub] = useState(false);
  const [blockTabs, setBlockTabs] = useState<Record<string, "preview" | "settings">>({});
  const [activePicker, setActivePicker] = useState<string | null>(null);

  // Hydrate store from server data on mount
  useEffect(() => {
    const notebookId = id || initialData?.id;
    if (notebookId) setNotebookId(notebookId);
    if (initialData?.config) {
      hydrateStore(initialData.config, initialData.name);
      setLastSaved(new Date(initialData.updated_at || initialData.created_at));
    }
  }, [initialData, hydrateStore, id, setNotebookId]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const targetId = id || initialData?.id || "default-notebook";
      await saveNotebook(targetId, { name: notebookTitle, activeBlocks, blocks, uiComponents });
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
  };

  const getBlockTab = (blockId: string) => blockTabs[blockId] || "preview";
  const setBlockTab = (blockId: string, tab: "preview" | "settings") =>
    setBlockTabs((prev) => ({ ...prev, [blockId]: tab }));

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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative flex flex-col">
        <div className="max-w-3xl mx-auto px-6 pt-6 pb-20 w-full">
          {/* Document Header */}
          <div className="mb-16">
            <input
              type="text"
              value={notebookTitle}
              onChange={(e) => setNotebookTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              className="w-full text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 outline-none bg-transparent hover:bg-white focus:bg-white focus:shadow-sm rounded-lg -ml-4 px-4 py-2 transition-all border border-transparent focus:border-zinc-200"
            />
            <p className="mt-2 text-zinc-400 text-base -ml-4 px-4">
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Block List */}
          <div className="relative mt-8">
            {activeBlocks.length > 0 && (
              <div className="absolute left-[-23px] top-6 bottom-12 w-[2px] bg-gradient-to-b from-blue-400 via-emerald-400 to-transparent z-0 opacity-30 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            )}
            <div className="space-y-12 relative z-10">
              {activeBlocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  blocks={blocks}
                  tab={getBlockTab(block.id)}
                  activePicker={activePicker === block.id ? block.id : null}
                  onTabChange={(tab) => setBlockTab(block.id, tab)}
                  onToggle={() => toggleBlock(block.id)}
                  onRemove={() => removeBlock(block.id)}
                  onRename={(name) => renameBlock(block.id, name)}
                  onToggleSource={(type) => toggleSource(block.id, type)}
                  onToggleUploadFormat={(fmt) => toggleUploadFormat(block.id, fmt)}
                  onSetInputInterface={(intf) => setInputInterface(block.id, intf)}
                  onSetOutputStyle={(style) => setOutputStyle(block.id, style)}
                  onSetResultConfig={(key, val) => setResultConfig(block.id, key, val)}
                  onSetTemplatedInput={(key, tpl) => setTemplatedInput(block.id, key, tpl)}
                  onPickerToggle={() => setActivePicker(activePicker === block.id ? null : block.id)}
                />
              ))}
            </div>
          </div>

          {/* Add Block Button */}
          <div
            onClick={() => setShowBlockPicker(true)}
            className="group flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 bg-white rounded-2xl py-10 transition-all text-center mt-8"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 text-xl transition-colors mb-3 group-hover:scale-110">+</div>
            <span className="text-zinc-500 group-hover:text-zinc-900 text-sm font-semibold">
              {activeBlocks.length === 0 ? "Add your first logic block..." : "Add another block..."}
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel: App Composer */}
      <AppComposer activeBlocks={activeBlocks} onShiftElement={shiftElementRank} notebookId={id || initialData?.id} />

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
