"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNotebookStore } from "@/store/notebookStore";
import { saveNotebook, renameNotebook as renameNotebookAction } from "@/lib/actions";
import type { MarketplaceMeta } from "@/lib/marketplace";
import type { Ceiling } from "@/lib/ceiling";
import {
  rowCanvasMeta,
  useNotebooks,
  type CanvasMeta,
  type MemoryMode,
  type ModelTier,
  type NotebookRow,
} from "../../app/(workspace)/workspace/NotebooksContext";

export type SaveStatus =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved" }
  | { state: "error"; message: string };

/**
 * Owns the "currently-open notebook" for Creator Studio: selection, one-time
 * hydration of the shared Zustand store from the selected row, and the single
 * debounced/manual save path. A trimmed sibling of the Canvas page's hydration
 * logic — same store, same config shape, same autosave guarantees — so the two
 * builders round-trip each other's notebooks without clobbering.
 */
export function useStudioNotebook(selectedNotebookId: string | null) {
  const { notebooks, patchLocal } = useNotebooks();
  const {
    activeBlocks,
    blocks,
    uiComponents,
    appScreens,
    theme,
    name: storeName,
    setName,
    setNotebookId,
    resetStore,
    hydrateStore,
    addBlock,
    toggleSource,
    setTemplatedInput,
    setStateSetting,
  } = useNotebookStore();

  const row: NotebookRow | null =
    notebooks.find((n) => n.id === selectedNotebookId) ?? null;

  const hydratedForIdRef = useRef<string | null>(null);
  const extraConfigRef = useRef<Record<string, unknown>>({});
  const [canvasMeta, setCanvasMeta] = useState<CanvasMeta | null>(null);
  const [marketplaceMeta, setMarketplaceMeta] = useState<MarketplaceMeta>({});
  const [hydrationComplete, setHydrationComplete] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: "idle" });

  // Hydrate the store whenever the open notebook changes. Full reset first so
  // nothing bleeds between notebooks; canvasMeta / marketplace / unknown keys
  // are held aside so they survive the save round-trip.
  useEffect(() => {
    if (!row) return;
    if (hydratedForIdRef.current === row.id) return;
    hydratedForIdRef.current = row.id;
    setHydrationComplete(false);
    resetStore();
    hydrateStore(row.config ?? {}, row.name);
    setNotebookId(row.id);
    // Strip the keys we manage explicitly; whatever remains is unknown legacy
    // config that must round-trip untouched on save.
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const {
      activeBlocks: _a,
      blocks: _b,
      uiComponents: _u,
      appScreens: _s,
      theme: _t,
      canvas: _c,
      marketplace: _m,
      ...extra
    } = row.config ?? {};
    /* eslint-enable @typescript-eslint/no-unused-vars */
    extraConfigRef.current = extra;
    setCanvasMeta(rowCanvasMeta(row));
    setMarketplaceMeta(row.config?.marketplace ?? {});
    const t = setTimeout(() => setHydrationComplete(true), 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.id]);

  const activeBlock = activeBlocks[0] ?? null;
  const compute = activeBlock ? blocks[activeBlock.id] : null;

  const sources = activeBlock?.sources ?? [];
  const clusterIds = sources
    .filter((s) => s.startsWith("topic:"))
    .map((s) => s.slice(6));
  const connectionIds = sources
    .filter((s) => s.startsWith("conn:"))
    .map((s) => s.slice(5));
  const hasConnectionSource = connectionIds.length > 0;

  const persona =
    compute?.inputBindings?.instructions?.type === "templated"
      ? (compute.inputBindings.instructions as { template: string }).template
      : "";
  const ceiling: Ceiling = canvasMeta?.ceiling ?? "private";
  const memory: MemoryMode = canvasMeta?.memory ?? "none";
  const modelTier: ModelTier = canvasMeta?.modelTier ?? "quick";
  const published = !!row?.slug;

  /* ── The single write path (mirrors Canvas.persistNow). Reads getState() at
   * call time with an id guard so a notebook switch mid-flight can never save
   * one notebook's state under another's id. ────────────────────────────── */
  const persistNow = useCallback(async (canvasOverride?: Partial<CanvasMeta>) => {
    if (!row || !canvasMeta) return;
    const id = row.id;
    const s = useNotebookStore.getState();
    if (s.notebookId !== id) return;
    // `canvasOverride` writes a canvasMeta change in the same save that carries
    // it, for callers that must not wait a render for setCanvasMeta to land —
    // publish sets ceiling: "public" and persists in one step.
    const canvas = canvasOverride ? { ...canvasMeta, ...canvasOverride } : canvasMeta;
    const config = {
      ...extraConfigRef.current,
      name: s.name,
      activeBlocks: s.activeBlocks,
      blocks: s.blocks,
      uiComponents: s.uiComponents,
      appScreens: s.appScreens,
      theme: s.theme,
      canvas,
      ...(Object.keys(marketplaceMeta).length > 0 ? { marketplace: marketplaceMeta } : {}),
    };
    setSaveStatus({ state: "saving" });
    try {
      await saveNotebook(id, config);
      // Fold an override into local state once it's durable, so the next
      // debounced autosave doesn't write the pre-override value back over it.
      if (canvasOverride) setCanvasMeta(canvas);
      const { name: savedName, ...rest } = config;
      patchLocal(id, {
        name: savedName,
        config: rest,
        updated_at: new Date().toISOString(),
      });
      setSaveStatus({ state: "saved" });
    } catch (err) {
      console.error("Studio save failed:", err);
      const msg = err instanceof Error ? err.message : "unknown error";
      const message = /unauthorized/i.test(msg)
        ? "Not saved — your session expired. Reload and sign in to keep editing."
        : `Not saved — ${msg}`;
      setSaveStatus({ state: "error", message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.id, canvasMeta, marketplaceMeta, patchLocal]);

  // Debounced autosave — same 2s window Canvas uses.
  useEffect(() => {
    if (!hydrationComplete || !row || !canvasMeta) return;
    const timer = setTimeout(() => void persistNow(), 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBlocks, blocks, uiComponents, appScreens, theme, storeName, canvasMeta, marketplaceMeta, hydrationComplete, row?.id, persistNow]);

  /* ── Setters ──────────────────────────────────────────────────────────── */

  // Attach/detach a prefixed source tag (`conn:` / `topic:`). Seeds a chat
  // block on the legacy no-block case, same as Canvas.handleToggleSource.
  const handleToggleSource = useCallback(
    (tag: string) => {
      if (activeBlock) {
        toggleSource(activeBlock.id, tag);
        return;
      }
      addBlock("chat");
      const newest = useNotebookStore.getState().activeBlocks[0];
      if (newest) toggleSource(newest.id, tag);
    },
    [activeBlock, addBlock, toggleSource],
  );

  const setPersona = useCallback(
    (text: string) => {
      if (activeBlock) setTemplatedInput(activeBlock.id, "instructions", text);
    },
    [activeBlock, setTemplatedInput],
  );

  const setModelTier = useCallback(
    (tier: ModelTier) => {
      if (activeBlock) setStateSetting(activeBlock.id, "modelTier", tier);
      setCanvasMeta((m) => (m ? { ...m, modelTier: tier } : m));
    },
    [activeBlock, setStateSetting],
  );

  const setMemory = useCallback((mode: MemoryMode) => {
    setCanvasMeta((m) => (m ? { ...m, memory: mode } : m));
  }, []);

  const rename = useCallback(
    (newName: string) => {
      if (!row) return;
      setName(newName);
      patchLocal(row.id, { name: newName });
      renameNotebookAction(row.id, newName).catch((err) =>
        console.error("Rename failed:", err),
      );
    },
    [row, setName, patchLocal],
  );

  return {
    row,
    name: storeName,
    activeBlock,
    sources,
    clusterIds,
    connectionIds,
    hasConnectionSource,
    persona,
    ceiling,
    memory,
    modelTier,
    published,
    marketplaceMeta,
    saveStatus,
    hydrationComplete,
    // actions
    persistNow,
    handleToggleSource,
    setPersona,
    setModelTier,
    setMemory,
    setMarketplaceMeta,
    rename,
  };
}
