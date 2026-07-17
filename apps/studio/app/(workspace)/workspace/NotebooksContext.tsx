"use client";

/**
 * Real, Supabase-backed notebook list for the Canvas experience — replaces
 * the old MockNotebooksContext (localStorage). Rows come from the `notebooks`
 * table (the same table the old block builder writes); Canvas treats each row
 * as a single-block notebook and edits it through the shared Zustand
 * notebookStore, autosaving via the saveNotebook server action.
 *
 * Canvas-only fields that have no home in the old builder's config shape
 * (ceiling, memory, onboarding flags) live under a `canvas` key in the
 * config JSON — see CanvasMeta. Both autosave sites (Canvas and the old
 * /notebook builder) preserve unknown config keys so neither clobbers the
 * other's data.
 */

import { createContext, useContext, useState, useCallback } from "react";
import type { Ceiling } from "@/lib/ceiling";
import {
  initializeNotebook,
  listNotebooks,
  updateNotebookSlug,
} from "@/lib/actions";

export type NotebookRow = {
  id: string;
  name: string;
  slug: string | null;
  config: any;
  created_at: string;
  updated_at: string;
};

export type AppType = "chat" | "search";

// "session"/"persistent" are priced-feature placeholders — not selectable
// yet, no billing system exists. Every notebook defaults to (and, for now,
// stays on) "none".
export type MemoryMode = "none" | "session" | "persistent";
const VALID_MEMORY_MODES = new Set<string>(["none", "session", "persistent"]);

// User-facing speed/capability tier, kept separate from the real backend
// model id (stateSettings.model). Today "thinking" and "expert" both call
// the same underlying model — the tier is still tracked distinctly so the
// UI knows which chip is active, and so nothing needs to change here the
// day a real third model backs "expert".
export type ModelTier = "quick" | "thinking" | "expert";
const VALID_MODEL_TIERS = new Set<string>(["quick", "thinking", "expert"]);

export type CanvasMeta = {
  ceiling: Ceiling;
  memory: MemoryMode;
  modelTier: ModelTier;
  appTypeChosen: boolean;
  onboardingComplete: boolean;
};

export const DEFAULT_CANVAS_META: CanvasMeta = {
  ceiling: "private",
  memory: "none",
  modelTier: "quick",
  appTypeChosen: false,
  onboardingComplete: false,
};

/* ── Pure row-derivation helpers ──────────────────────────────────── */

export function rowCanvasMeta(r: NotebookRow): CanvasMeta {
  // Legacy rows (created by the old builder, no `canvas` key) never get the
  // onboarding wizard retroactively.
  if (!r.config?.canvas) {
    return {
      ...DEFAULT_CANVAS_META,
      onboardingComplete: true,
      appTypeChosen: (r.config?.activeBlocks?.length ?? 0) > 0,
    };
  }
  const merged = { ...DEFAULT_CANVAS_META, ...r.config.canvas };
  // Defensive: earlier builds stored memory as freeform text, and predate
  // modelTier entirely — anything unrecognized falls back to the safe
  // default rather than breaking the pickers.
  if (!VALID_MEMORY_MODES.has(merged.memory)) merged.memory = "none";
  if (!VALID_MODEL_TIERS.has(merged.modelTier)) merged.modelTier = "quick";
  return merged;
}

export function rowClusterIds(r: NotebookRow): string[] {
  return (r.config?.activeBlocks?.[0]?.sources ?? [])
    .filter((s: string) => s.startsWith("topic:"))
    .map((s: string) => s.slice(6));
}

export function rowPublished(r: NotebookRow): boolean {
  return !!r.slug;
}

export function rowAppType(r: NotebookRow): AppType | null {
  return rowCanvasMeta(r).appTypeChosen
    ? ((r.config?.activeBlocks?.[0]?.blockTypeId as AppType) ?? null)
    : null;
}

/* ── Seed config for new Canvas notebooks ─────────────────────────── */

function buildSeedConfig(opts: {
  name?: string;
  clusterIds?: string[];
  connectionIds?: string[];
  ceiling?: Ceiling;
  persona?: string;
}) {
  const blockId = `chat_${Date.now()}`;
  return {
    name: opts.name ?? "Untitled notebook",
    activeBlocks: [
      {
        id: blockId,
        blockTypeId: "chat",
        name: "Chat",
        slug: "chat_block",
        expanded: true,
        // "topic:" scopes a semantic cluster (see ClusterDrawer's build
        // action); "conn:" scopes an entire connection (Drive account or
        // YouTube channel) — same tag ConnectionScopePicker toggles in
        // Canvas's Knowledge Scope panel.
        sources: [
          ...(opts.clusterIds ?? []).map((c) => `topic:${c}`),
          ...(opts.connectionIds ?? []).map((c) => `conn:${c}`),
        ],
        uploadFormats: ["pdf"],
      },
    ],
    blocks: {
      [blockId]: {
        id: blockId,
        type: "chat",
        status: "idle",
        stateSettings: { model: "gemini-3-flash" },
        inputBindings: {
          instructions: { type: "templated", template: opts.persona ?? "" },
        },
        triggers: [],
        currentInputs: {},
        outputs: { stream: "", sources: [], history: [] },
      },
    },
    uiComponents: {},
    appScreens: [],
    theme: {
      primaryColor: "#3C4A3A",
      backgroundColor: "#F1EEE2",
      borderRadius: "12px",
      borderWidth: "1px",
      boxShadow:
        "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      fontFamily: "font-sans",
      appLabel: opts.name ?? "Untitled notebook",
      showBanner: true,
    },
    // A notebook built from a whole connection (e.g. "Build Notebook from
    // YouTube") arrives pre-scoped with a chat block — it never goes through
    // the cluster/appType onboarding, so seeding it as still-onboarding would
    // trap it in an empty guided-setup view in Canvas. Mark it complete.
    canvas: {
      ...DEFAULT_CANVAS_META,
      ceiling: opts.ceiling ?? "private",
      ...((opts.connectionIds?.length ?? 0) > 0
        ? { appTypeChosen: true, onboardingComplete: true }
        : {}),
    },
  };
}

/* ── Provider ─────────────────────────────────────────────────────── */

type NotebooksValue = {
  notebooks: NotebookRow[];
  refresh: () => Promise<void>;
  patchLocal: (id: string, patch: Partial<NotebookRow>) => void;
  createNotebook: (opts: {
    name?: string;
    clusterIds?: string[];
    connectionIds?: string[];
    ceiling?: Ceiling;
    persona?: string;
  }) => Promise<NotebookRow>;
  deployNotebook: (id: string) => Promise<{ slug: string } | { error: string }>;
  renameSlug: (id: string, slug: string) => Promise<{ slug: string } | { error: string }>;
  dependentsOf: (clusterId: string) => NotebookRow[];
};

const NotebooksContext = createContext<NotebooksValue | null>(null);

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "notebook"
  );
}

export function NotebooksProvider({
  initial,
  children,
}: {
  initial: NotebookRow[];
  children: React.ReactNode;
}) {
  // Client state is authoritative after mount — revalidatePath in
  // saveNotebook re-renders the layout on every autosave, and re-seeding
  // from a possibly-stale server fetch would fight the optimistic updates.
  const [notebooks, setNotebooks] = useState<NotebookRow[]>(initial);

  const refresh = useCallback(async () => {
    try {
      const rows = await listNotebooks();
      setNotebooks(rows as NotebookRow[]);
    } catch (err) {
      console.error("Failed to refresh notebooks:", err);
    }
  }, []);

  const patchLocal = useCallback((id: string, patch: Partial<NotebookRow>) => {
    setNotebooks((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    );
  }, []);

  const createNotebook = useCallback(
    async (opts: {
      name?: string;
      clusterIds?: string[];
      connectionIds?: string[];
      ceiling?: Ceiling;
      persona?: string;
    }) => {
      const row = (await initializeNotebook(
        buildSeedConfig(opts),
      )) as NotebookRow;
      setNotebooks((prev) => [...prev, row]);
      return row;
    },
    [],
  );

  const deployNotebook = useCallback(
    async (id: string): Promise<{ slug: string } | { error: string }> => {
      const row = notebooks.find((n) => n.id === id);
      if (!row) return { error: "Notebook not found." };
      if (row.slug) return { slug: row.slug };

      const base = slugify(row.name);
      for (let i = 0; i < 15; i++) {
        const candidate = i === 0 ? base : `${base}-${i + 1}`;
        const err = await updateNotebookSlug(id, candidate);
        if (!err) {
          patchLocal(id, { slug: candidate });
          return { slug: candidate };
        }
        // updateNotebookSlug reports a unique-violation as "...already taken..."
        // and a collision with a real app route (e.g. a notebook named
        // "Login") as "...reserved..." — both mean "try another candidate,"
        // anything else is fatal.
        if (!/taken|reserved/i.test(err)) return { error: err };
      }
      return { error: "Couldn't find an available link name." };
    },
    [notebooks, patchLocal],
  );

  // Manual slug edit — usable both before publish (sets the initial link,
  // implicitly publishing since `published` is derived from `!!row.slug`)
  // and after (renames the live link). Unlike deployNotebook this never
  // auto-suffixes on collision; the caller picked this exact slug, so a
  // taken/reserved name is reported back rather than silently altered.
  const renameSlug = useCallback(
    async (id: string, slugInput: string): Promise<{ slug: string } | { error: string }> => {
      // Mirrors updateNotebookSlug's own sanitization so the value patched
      // into local state matches what actually got stored server-side,
      // rather than the raw (possibly mixed-case/invalid) typed input.
      const slug = slugify(slugInput);
      const err = await updateNotebookSlug(id, slug);
      if (err) return { error: err };
      patchLocal(id, { slug });
      return { slug };
    },
    [patchLocal],
  );

  const dependentsOf = useCallback(
    (clusterId: string) =>
      notebooks.filter((n) => rowClusterIds(n).includes(clusterId)),
    [notebooks],
  );

  return (
    <NotebooksContext.Provider
      value={{
        notebooks,
        refresh,
        patchLocal,
        createNotebook,
        deployNotebook,
        renameSlug,
        dependentsOf,
      }}
    >
      {children}
    </NotebooksContext.Provider>
  );
}

export function useNotebooks() {
  const ctx = useContext(NotebooksContext);
  if (!ctx)
    throw new Error("useNotebooks must be used within NotebooksProvider");
  return ctx;
}
