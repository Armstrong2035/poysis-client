"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Chat } from "@/components/ui/chat/Chat";
import { BlueprintDesigner } from "@/components/notebook/BlueprintDesigner";
import { useNotebookStore } from "@/store/notebookStore";
import { saveNotebook, renameNotebook as renameNotebookAction } from "@/lib/actions";
import { MARKETPLACE_URL, type MarketplaceMeta } from "@/lib/marketplace";
import { MarketplaceFields } from "@/components/notebook/MarketplaceFields";
import { SourcesDrawer, type SourceCategory } from "@/components/notebook/SourcesDrawer";
import { useConsolidation } from "../ConsolidationContext";
import { useMockPermissions } from "../MockPermissionsContext";
import {
  useNotebooks,
  rowCanvasMeta,
  rowClusterIds,
  rowPublished,
  type AppType,
  type CanvasMeta,
  type MemoryMode,
  type ModelTier,
} from "../NotebooksContext";
import { useOnboarding } from "../OnboardingContext";
import {
  CEILING_BG,
  CEILING_COLOR,
  CEILING_DOT,
  CEILING_LABEL,
  CEILING_RANK,
  type Ceiling,
  rankToCeiling,
} from "@/lib/ceiling";

/* A pending ceiling widen — the only ceiling change that ever needs
 * confirmation. Narrowing (cluster or notebook) always applies immediately. */
type Proposal = {
  entity: "cluster" | "notebook";
  id: string;
  target: Ceiling;
  checked: boolean;
};

function parseCeilingTarget(text: string): Ceiling | null {
  const lower = text.toLowerCase();
  if (/\bpublic\b/.test(lower)) return "public";
  if (/\bteam\b/.test(lower)) return "team";
  if (/\bprivate\b/.test(lower)) return "private";
  return null;
}

/* Which settings field the chat and the settings drawer are both
 * highlighting right now — either because onboarding's step 3 is walking
 * through it in sequence, or because a normal chat message got redirected
 * here (see redirectFocus). Ephemeral, not persisted: it's just "what's in
 * view this session," derivable fresh each visit. */
type FocusField = "persona" | "model" | "schema" | "memory" | "acl" | "sources";

/* The settings drawer shows one section at a time — the full config stacked
 * into a single scroll was too long to find anything in. Each section is
 * reachable directly from the canvas bar. */
type SettingsSection = "setup" | "look" | "tuning" | "listing";

const SETTINGS_SECTIONS: { id: SettingsSection; label: string; hint: string }[] = [
  { id: "setup", label: "Setup", hint: "Name, access, sources, persona, model, memory" },
  { id: "look", label: "Look & feel", hint: "How the published app looks to visitors" },
  { id: "tuning", label: "Tuning", hint: "Fine-tune how answers are generated" },
  { id: "listing", label: "Listing", hint: "Public link and how it appears in the marketplace" },
];

const FOCUS_COLOR: Record<FocusField, string> = {
  persona: "#6B7FD7",
  model: "#B589C9",
  schema: "#5FA8A0",
  memory: "#8A7FCB",
  acl: "#C97F8C",
  sources: "#7FB0C9",
};

const FOCUS_LABEL: Record<FocusField, string> = {
  persona: "Persona",
  model: "Model",
  schema: "Result card",
  memory: "Memory / chat behavior",
  acl: "ACL",
  sources: "Sources",
};

/* Speed/capability tiers shown to the user, instead of raw model names.
 * "Thinking" and "Expert" both call gemini-3-pro today — there's only one
 * stronger model available — but the tier is tracked as its own concept
 * (CanvasMeta.modelTier) so the UI can tell them apart, and so the day a
 * distinct "expert" model exists, only this map needs to change. */
const TIER_MODEL: Record<ModelTier, string> = {
  quick: "gemini-3-flash",
  thinking: "gemini-3-pro",
  expert: "gemini-3-pro",
};

const MODEL_TIER_OPTIONS: { id: ModelTier; label: string }[] = [
  { id: "quick", label: "Quick" },
  { id: "thinking", label: "Thinking" },
  { id: "expert", label: "Expert" },
];

const MEMORY_OPTIONS: { id: MemoryMode; label: string; locked: boolean }[] = [
  { id: "none", label: "No memory", locked: false },
  { id: "session", label: "Remembers this session", locked: true },
  { id: "persistent", label: "Remembers across sessions", locked: true },
];

export default function CanvasPage() {
  return (
    <Suspense fallback={null}>
      <CanvasInner />
    </Suspense>
  );
}

function CanvasInner() {
  const searchParams = useSearchParams();
  const { topics, refreshKnowledge } = useConsolidation();
  const { getCeiling, setCeiling } = useMockPermissions();
  const { notebooks, patchLocal, createNotebook, deployNotebook, renameSlug, dependentsOf } = useNotebooks();
  const { markDone } = useOnboarding();

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
    replaceBlockType,
    toggleSource,
    setTemplatedInput,
    setStateSetting,
  } = useNotebookStore();

  useEffect(() => {
    if (topics === null) refreshKnowledge();
  }, [topics, refreshKnowledge]);

  const [manualNotebookId, setManualNotebookId] = useState<string | null>(null);
  const paramNotebookId = searchParams.get("notebook");
  const selectedNotebookId =
    manualNotebookId ??
    (paramNotebookId && notebooks.some((n) => n.id === paramNotebookId)
      ? paramNotebookId
      : (notebooks[0]?.id ?? null));
  const row = notebooks.find((n) => n.id === selectedNotebookId) ?? null;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [sourcesCategory, setSourcesCategory] = useState<SourceCategory>("platforms");
  const [notebookSettingsOpen, setNotebookSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("setup");
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [refusedMessage, setRefusedMessage] = useState<string | null>(null);
  const [step3SubStep, setStep3SubStep] = useState<FocusField>("persona");
  const [redirectFocus, setRedirectFocus] = useState<FocusField | null>(null);
  const [creating, setCreating] = useState(false);
  const [deploying, setDeploying] = useState(false);
  // Save status surfaced in the toolbar so a failed autosave (e.g. an expired
  // session throwing Unauthorized) is never silent again.
  const [saveStatus, setSaveStatus] = useState<
    { state: "idle" } | { state: "saving" } | { state: "saved" } | { state: "error"; message: string }
  >({ state: "idle" });

  /* ── Store hydration: load the selected row into the shared Zustand
   * store (same store the old /notebook builder uses — only one page is
   * active at a time). Full reset first so nothing bleeds between
   * notebooks. canvasMeta and unknown config keys are held aside in React
   * state / a ref so they survive the save round-trip. ─────────────── */
  const hydratedForIdRef = useRef<string | null>(null);
  const extraConfigRef = useRef<Record<string, any>>({});
  const [canvasMeta, setCanvasMeta] = useState<CanvasMeta | null>(null);
  const [marketplaceMeta, setMarketplaceMeta] = useState<MarketplaceMeta>({});
  const [hydrationComplete, setHydrationComplete] = useState(false);

  useEffect(() => {
    if (!row) return;
    if (hydratedForIdRef.current === row.id) return;
    hydratedForIdRef.current = row.id;
    setHydrationComplete(false);
    resetStore();
    hydrateStore(row.config ?? {}, row.name);
    setNotebookId(row.id);
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
    extraConfigRef.current = extra;
    setCanvasMeta(rowCanvasMeta(row));
    setMarketplaceMeta(row.config?.marketplace ?? {});
    const t = setTimeout(() => setHydrationComplete(true), 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.id]);

  useEffect(() => {
    setStep3SubStep("persona");
    setRedirectFocus(null);
    setProposal(null);
  }, [selectedNotebookId]);

  /* ── Derived fields — always from the live store, never the (possibly
   * stale) provider row. Canvas edits activeBlocks[0] only; any extra
   * legacy blocks round-trip untouched. ────────────────────────────── */
  const activeBlock = activeBlocks[0] ?? null;
  const compute = activeBlock ? blocks[activeBlock.id] : null;
  const clusterIds = (activeBlock?.sources ?? [])
    .filter((s) => s.startsWith("topic:"))
    .map((s) => s.slice(6));
  // A connection source (conn:) means this notebook was built from a whole
  // source (e.g. "Build Notebook from YouTube") rather than assembled cluster
  // by cluster. It's already scoped and configured, so it must NOT be treated
  // as a fresh notebook that owes the cluster/appType onboarding — otherwise
  // the step logic below (which counts only topic: clusters) would trap it in
  // an empty "add a cluster" step and hide its real config. Repairs existing
  // rows at render time, no DB write needed.
  const isConnectionScoped = (activeBlock?.sources ?? []).some((s) =>
    s.startsWith("conn:"),
  );
  const persona = compute?.inputBindings?.instructions?.type === "templated"
    ? (compute.inputBindings.instructions as { template: string }).template
    : "";
  const model = (compute?.stateSettings?.model as string) ?? "gemini-3-flash";
  const appType: AppType | null = (canvasMeta?.appTypeChosen || isConnectionScoped)
    ? ((activeBlock?.blockTypeId as AppType) ?? null)
    : null;
  const ceiling: Ceiling = canvasMeta?.ceiling ?? "private";
  const memory: MemoryMode = canvasMeta?.memory ?? "none";
  const modelTier: ModelTier = canvasMeta?.modelTier ?? "quick";
  const published = !!row?.slug;
  const nbName = storeName;

  const applyModelTier = (tier: ModelTier) => {
    if (activeBlock) setStateSetting(activeBlock.id, "model", TIER_MODEL[tier]);
    setCanvasMeta((m) => (m ? { ...m, modelTier: tier } : m));
  };

  const step: 1 | 2 | 3 | null =
    !row || !canvasMeta || canvasMeta.onboardingComplete || isConnectionScoped
      ? null
      : clusterIds.length === 0
        ? 1
        : appType == null
          ? 2
          : 3;

  useEffect(() => {
    if (step === 3) {
      setSettingsSection("setup");
      setNotebookSettingsOpen(true);
    }
  }, [step]);

  /* ── Persist: the single write path, shared by the debounced autosave and
   * the manual Save button. Reads getState() at call time with an id guard
   * so a picker switch mid-flight can never save one notebook's state under
   * another's id. Surfaces success/failure via saveStatus so a failed write
   * (e.g. an expired session throwing Unauthorized) is never silent. ──── */
  const persistNow = useCallback(async () => {
    if (!row || !canvasMeta) return;
    const id = row.id;
    const s = useNotebookStore.getState();
    if (s.notebookId !== id) return;
    const config = {
      ...extraConfigRef.current,
      name: s.name,
      activeBlocks: s.activeBlocks,
      blocks: s.blocks,
      uiComponents: s.uiComponents,
      appScreens: s.appScreens,
      theme: s.theme,
      canvas: canvasMeta,
      ...(Object.keys(marketplaceMeta).length > 0 ? { marketplace: marketplaceMeta } : {}),
    };
    setSaveStatus({ state: "saving" });
    try {
      await saveNotebook(id, config);
      const { name: savedName, ...rest } = config;
      patchLocal(id, {
        name: savedName,
        config: rest,
        updated_at: new Date().toISOString(),
      });
      setSaveStatus({ state: "saved" });
    } catch (err: any) {
      console.error("Canvas save failed:", err);
      const message = /unauthorized/i.test(err?.message ?? "")
        ? "Not saved — your session expired. Reload and sign in to keep editing."
        : `Not saved — ${err?.message ?? "unknown error"}`;
      setSaveStatus({ state: "error", message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.id, canvasMeta, marketplaceMeta, patchLocal]);

  useEffect(() => {
    if (!hydrationComplete || !row || !canvasMeta) return;
    const timer = setTimeout(() => void persistNow(), 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBlocks, blocks, uiComponents, appScreens, theme, storeName, canvasMeta, marketplaceMeta, hydrationComplete, row?.id, persistNow]);

  const byId = new Map((topics ?? []).map((t) => [t.topic_id, t]));
  const clusterName = (id: string) => byId.get(id)?.label ?? id;
  const clusterDocCount = (id: string) => byId.get(id)?.doc_count ?? 0;

  const selectNotebook = (id: string) => {
    setManualNotebookId(id);
    setPickerOpen(false);
    setProposal(null);
  };

  const handleCreateNotebook = async (opts?: {
    name?: string;
    clusterIds?: string[];
    ceiling?: Ceiling;
  }) => {
    if (creating) return;
    setCreating(true);
    try {
      const nb = await createNotebook(opts ?? { name: "Untitled notebook" });
      selectNotebook(nb.id);
    } catch (err) {
      console.error("Failed to create notebook:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeploy = async () => {
    if (!row || row.slug || deploying) return;
    setDeploying(true);
    try {
      const res = await deployNotebook(row.id);
      if ("slug" in res) markDone("deployedNotebook");
      else console.error("Deploy failed:", res.error);
    } finally {
      setDeploying(false);
    }
  };

  const handleRename = (newName: string) => {
    if (!row) return;
    setName(newName);
    patchLocal(row.id, { name: newName });
    // Name column syncs immediately (not just via the debounced autosave)
    // so a quick navigation right after renaming can't lose it.
    renameNotebookAction(row.id, newName).catch((err) =>
      console.error("Rename failed:", err),
    );
  };

  const handleSlugSave = async (newSlug: string): Promise<string | null> => {
    if (!row) return "Notebook not found.";
    const res = await renameSlug(row.id, newSlug);
    if ("error" in res) return res.error;
    if (!row.slug) markDone("deployedNotebook");
    return null;
  };

  /* Toggle any prefixed source tag (`topic:…` / `conn:…`) on the notebook.
   * Generalized from the old cluster-only path so the Sources drawer can
   * attach platforms the same way, including the legacy no-block fallback. */
  const handleToggleSource = (tag: string) => {
    if (activeBlock) {
      toggleSource(activeBlock.id, tag);
      return;
    }
    // Legacy row with no blocks — seed a chat block on demand, then attach.
    addBlock("chat");
    const newest = useNotebookStore.getState().activeBlocks[0];
    if (newest) toggleSource(newest.id, tag);
  };


  if (!row) {
    return (
      <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8A9488",
            fontSize: "14px",
          }}
        >
          Create your first notebook to get started.
        </div>
        <div style={{ position: "absolute", bottom: 20, left: 20, zIndex: 6 }}>
          <button
            onClick={() => handleCreateNotebook()}
            disabled={creating}
            style={{
              cursor: creating ? "default" : "pointer",
              padding: "11px 16px",
              borderRadius: "10px",
              border: "1px solid #E4DECC",
              background: "#FAF8F0",
              fontWeight: 600,
              fontSize: "13.5px",
              color: "#7E3A33",
              opacity: creating ? 0.6 : 1,
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            {creating ? "Creating…" : "+ New notebook"}
          </button>
        </div>
      </div>
    );
  }

  const floorRank = clusterIds.length
    ? Math.min(...clusterIds.map((cid) => CEILING_RANK[getCeiling(cid)]))
    : CEILING_RANK.public;
  const floorLabel = CEILING_LABEL[rankToCeiling(floorRank)];

  const applyCeilingChange = (
    entity: "cluster" | "notebook",
    id: string,
    target: Ceiling,
  ) => {
    setRefusedMessage(null);
    const currentRank =
      entity === "cluster" ? CEILING_RANK[getCeiling(id)] : CEILING_RANK[ceiling];

    if (target === rankToCeiling(currentRank)) return;

    if (entity === "notebook" && CEILING_RANK[target] > floorRank) {
      const capperId = clusterIds.find(
        (cid) => CEILING_RANK[getCeiling(cid)] === floorRank,
      );
      const capperName = capperId ? clusterName(capperId) : "a linked cluster";
      setRefusedMessage(
        `Can't set this notebook wider than ${floorLabel}. "${capperName}" is scoped in and is ${floorLabel}, so it caps every notebook that draws from it.`,
      );
      return;
    }

    if (CEILING_RANK[target] > currentRank) {
      setProposal({ entity, id, target, checked: false });
      return;
    }

    // Narrowing always applies immediately.
    if (entity === "cluster") setCeiling(id, target);
    else setCanvasMeta((m) => (m ? { ...m, ceiling: target } : m));
    markDone("changedCeiling");
  };

  const confirmProposal = () => {
    if (!proposal || !proposal.checked) return;
    if (proposal.entity === "cluster") setCeiling(proposal.id, proposal.target);
    else setCanvasMeta((m) => (m ? { ...m, ceiling: proposal.target } : m));
    markDone("changedCeiling");
    setProposal(null);
  };

  const handleChatCommand = (text: string): string | null => {
    const marker = text.trim();

    if (step === 2) {
      if (marker === "pick-chat" || marker.toLowerCase() === "chat") {
        setCanvasMeta((m) => (m ? { ...m, appTypeChosen: true } : m));
        return `Got it — a conversational notebook. Let's personalize it.`;
      }
      if (marker === "pick-search" || marker.toLowerCase() === "search") {
        if (activeBlock) replaceBlockType(activeBlock.id, "search");
        setCanvasMeta((m) => (m ? { ...m, appTypeChosen: true } : m));
        return `Got it — a search notebook, with citations. Let's personalize it.`;
      }
      // Free-form discovery — fall through to the real chat call (grounded
      // in Ouroboros via useOuroboros) rather than intercepting.
      return null;
    }

    if (step === 3) {
      if (step3SubStep === "persona") {
        if (marker === "continue-persona") {
          setStep3SubStep("model");
          return `Great — now let's pick a model.`;
        }
        if (activeBlock) setTemplatedInput(activeBlock.id, "instructions", text);
        // Still falls through — the assistant can react/coach on the
        // phrasing, grounded in Ouroboros. The field is already set from
        // the user's literal words regardless of what it says back.
        return null;
      }

      if (step3SubStep === "model") {
        const picked = MODEL_TIER_OPTIONS.find((m) => m.id === marker);
        if (picked) {
          applyModelTier(picked.id);
          if (appType === "search") {
            setStep3SubStep("schema");
            setSettingsSection("setup");
            setNotebookSettingsOpen(true);
            return `Set. Now design your result card in the settings drawer — add and arrange the fields end users should see, then continue.`;
          }
          setCanvasMeta((m) => (m ? { ...m, onboardingComplete: true } : m));
          return `All set — "${nbName}" is ready.`;
        }
        return null;
      }

      if (step3SubStep === "schema") {
        if (marker === "continue-schema") {
          setCanvasMeta((m) => (m ? { ...m, onboardingComplete: true } : m));
          return `All set — "${nbName}" is ready.`;
        }
        return null;
      }
    }

    markDone("builtNotebook");

    const target = parseCeilingTarget(text);
    if (target) {
      const curRank = CEILING_RANK[ceiling];
      const targetRank = CEILING_RANK[target];

      if (targetRank === curRank)
        return `"${nbName}" is already ${CEILING_LABEL[target]}.`;

      if (targetRank > floorRank) {
        const capperId = clusterIds.find(
          (cid) => CEILING_RANK[getCeiling(cid)] === floorRank,
        );
        const capperName = capperId ? clusterName(capperId) : "a linked cluster";
        return `I can't set this notebook wider than ${floorLabel}. "${capperName}" is scoped in and is ${floorLabel}, so it caps every notebook that draws from it.`;
      }

      if (targetRank > curRank) {
        setProposal({ entity: "notebook", id: row.id, target, checked: false });
        return `That widens "${nbName}" from ${CEILING_LABEL[ceiling]} to ${CEILING_LABEL[target]}. I've drafted it in the settings bar below — it needs your confirmation since it changes who can reach this notebook.`;
      }

      setCanvasMeta((m) => (m ? { ...m, ceiling: target } : m));
      markDone("changedCeiling");
      return `Done — narrowed "${nbName}" to ${CEILING_LABEL[target]}. Narrowing never needs confirmation.`;
    }

    const renameMatch = text.match(
      /rename (?:it |this |the notebook )?to ["“]?([^"”]+?)["”]?$/i,
    );
    if (renameMatch) {
      const newName = renameMatch[1].trim();
      handleRename(newName);
      return `Renamed to "${newName}".`;
    }

    if (/\b(deploy|publish)\b/i.test(text)) {
      if (published) return `"${nbName}" is already published at ${MARKETPLACE_URL}/${row.slug}.`;
      void handleDeploy();
      return `Publishing — the share link will appear in the settings bar in a moment.`;
    }

    // Settings changes we don't execute directly from chat are reached only
    // via an explicit chip click (marker below), never guessed from typed
    // text — that guessing was tried and dropped: a knowledge question that
    // happened to contain "model" or "source" would misfire just as easily
    // as a genuine settings request would get missed by different wording.
    if (marker.startsWith("redirect:")) {
      const field = marker.slice("redirect:".length) as FocusField;
      // Every focusable field (persona, model, schema, memory, ACL, sources)
      // lives in Setup — force it so a chat redirect can't land on a section
      // that doesn't contain the field being highlighted.
      setSettingsSection("setup");
      setNotebookSettingsOpen(true);
      setRedirectFocus(field);
      if (field === "acl") {
        return `Access control isn't configurable yet — it depends on Teams & Permissions, which isn't built. I've opened notebook settings so you can see where it'll live.`;
      }
      if (field === "memory") {
        return `This notebook has no memory by default — remembering context is a priced feature that isn't available yet. I've opened notebook settings so you can see what's coming.`;
      }
      return `I've opened notebook settings and highlighted "${FOCUS_LABEL[field]}" for you.`;
    }

    return null;
  };

  const selectedCluster = selectedClusterId
    ? (byId.get(selectedClusterId) ?? null)
    : null;

  const focusField: FocusField | null =
    step === 3 ? step3SubStep : redirectFocus;
  const useOuroborosNow =
    step === 2 || (step === 3 && step3SubStep === "persona");

  let chatPlaceholder = "Tell it what to change…";
  let chatQuickPrompts: { label: string; text: string }[] = [
    { label: "Make this public", text: "Make this public" },
    { label: "Narrow to Private", text: "Make this private" },
    { label: "Rename notebook", text: 'Rename it to "New name"' },
    { label: "Deploy", text: "Deploy this notebook" },
    { label: "Edit persona", text: "redirect:persona" },
    { label: "Change model", text: "redirect:model" },
    { label: "Edit memory", text: "redirect:memory" },
    { label: "Edit sources", text: "redirect:sources" },
    { label: "Access control", text: "redirect:acl" },
    ...(appType === "search"
      ? [{ label: "Result card", text: "redirect:schema" }]
      : []),
  ];
  let onboardingInstruction = "";

  if (step === 1) {
    onboardingInstruction =
      'Add a cluster using the "+ Cluster" button below to get started.';
    chatQuickPrompts = [];
  } else if (step === 2) {
    onboardingInstruction =
      "What do you want people to be able to do with this notebook?";
    chatPlaceholder = "Tell me about what you're building…";
    chatQuickPrompts = [
      { label: "💬 Conversational chat", text: "pick-chat" },
      { label: "🔍 Search with citations", text: "pick-search" },
    ];
  } else if (step === 3) {
    if (step3SubStep === "persona") {
      onboardingInstruction =
        "Describe how this notebook should sound — I'll write it down as we go.";
      chatPlaceholder = "e.g. Friendly and concise, avoids jargon…";
      chatQuickPrompts = [
        { label: "Looks good → continue", text: "continue-persona" },
      ];
    } else if (step3SubStep === "model") {
      onboardingInstruction = "Pick a speed for this notebook.";
      chatQuickPrompts = MODEL_TIER_OPTIONS.map((m) => ({
        label: m.label,
        text: m.id,
      }));
    } else if (step3SubStep === "schema") {
      onboardingInstruction =
        "Design your result card in the settings drawer, then continue.";
      chatQuickPrompts = [{ label: "Continue →", text: "continue-schema" }];
    }
  }

  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      {/* Cluster cards */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "auto",
          padding: "100px 40px 140px 40px",
          display: "flex",
          flexWrap: "wrap",
          alignContent: "flex-start",
          gap: "22px",
        }}
      >
        {clusterIds.map((cid) => (
          <ClusterCard
            key={cid}
            name={clusterName(cid)}
            docCount={clusterDocCount(cid)}
            ceiling={getCeiling(cid)}
            onClick={() => setSelectedClusterId(cid)}
          />
        ))}
        {clusterIds.length === 0 && (
          <div
            style={{ color: "#8A9488", fontSize: "14px", padding: "14px 0" }}
          >
            No clusters in this notebook yet — use &quot;+ Cluster&quot; below
            to add one.
          </div>
        )}
      </div>

      {/* Notebook picker */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 6,
          width: pickerOpen ? "320px" : "260px",
        }}
      >
        {!pickerOpen ? (
          <div
            onClick={() => setPickerOpen(true)}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#FAF8F0",
              border: "1px solid #E4DECC",
              borderRadius: "10px",
              padding: "11px 14px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: CEILING_DOT[ceiling],
                flexShrink: 0,
              }}
            />
            <div
              style={{
                flex: 1,
                fontWeight: 600,
                fontSize: "13.5px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {nbName}
            </div>
            <div style={{ color: "#8A9488", fontSize: "12px" }}>▾</div>
          </div>
        ) : (
          <div
            style={{
              background: "#FAF8F0",
              border: "1px solid #E4DECC",
              borderRadius: "12px",
              padding: "10px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            }}
          >
            <div
              onClick={() => setPickerOpen(false)}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 6px 10px 6px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#8A9488",
                }}
              >
                Notebooks
              </div>
              <div style={{ color: "#8A9488", fontSize: "12px" }}>▴</div>
            </div>
            {notebooks.map((n) => {
              const nMeta = rowCanvasMeta(n);
              const nClusters = rowClusterIds(n);
              return (
                <div
                  key={n.id}
                  onClick={() => selectNotebook(n.id)}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "9px 8px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      border: `1.5px solid ${CEILING_DOT[nMeta.ceiling]}`,
                      background:
                        n.id === row.id ? CEILING_DOT[nMeta.ceiling] : "transparent",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "13.5px",
                        fontWeight: n.id === row.id ? 600 : 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n.id === row.id ? nbName : n.name}
                    </div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "#8A9488",
                        marginTop: "1px",
                      }}
                    >
                      {nClusters.length} cluster
                      {nClusters.length === 1 ? "" : "s"} ·{" "}
                      {rowPublished(n) ? "Published" : "Draft"}
                    </div>
                  </div>
                </div>
              );
            })}
            <div
              style={{
                borderTop: "1px solid #E4DECC",
                marginTop: "6px",
                paddingTop: "6px",
              }}
            >
              <div
                onClick={() => handleCreateNotebook()}
                style={{
                  cursor: creating ? "default" : "pointer",
                  padding: "9px 8px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#7E3A33",
                  opacity: creating ? 0.6 : 1,
                }}
              >
                {creating ? "Creating…" : "+ New notebook"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding banner */}
      {step !== null && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "360px",
            right: "20px",
            zIndex: 6,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "#FAF8F0",
            border: `1px solid ${focusField ? FOCUS_COLOR[focusField] + "55" : "#E4DECC"}`,
            borderRadius: "12px",
            padding: "11px 14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: focusField ? FOCUS_COLOR[focusField] : "#C99A5C",
              flexShrink: 0,
            }}
          >
            Step {step} of 3
          </div>
          <div
            style={{
              flex: 1,
              fontSize: "13px",
              color: "#55594D",
              lineHeight: 1.4,
            }}
          >
            {onboardingInstruction}
          </div>
          <div
            onClick={() =>
              setCanvasMeta((m) => (m ? { ...m, onboardingComplete: true } : m))
            }
            style={{
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              color: "#8A9488",
              flexShrink: 0,
            }}
          >
            Skip setup →
          </div>
        </div>
      )}

      {/* Notebook settings bar */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          // Wide enough to hold the four config tabs on one line at equal
          // width; still shrinks rather than overflowing on narrow canvases.
          width: "min(620px, calc(100% - 40px))",
          zIndex: 6,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          background: "#FAF8F0",
          border: "1px solid #E4DECC",
          borderRadius: "12px",
          padding: "10px 12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              padding: "3px 9px",
              borderRadius: "20px",
              background: CEILING_BG[ceiling],
              color: CEILING_COLOR[ceiling],
            }}
          >
            {CEILING_LABEL[ceiling]}
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: "13.5px",
              maxWidth: "200px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {nbName}
          </div>
          <div
            onClick={() => setSourcesOpen(true)}
            style={{
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #E4DECC",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#262922",
            }}
          >
            Sources
          </div>
          <div
            onClick={() => {
              if (saveStatus.state !== "saving") void persistNow();
            }}
            title="Save now"
            style={{
              cursor: saveStatus.state === "saving" ? "default" : "pointer",
              padding: "8px 12px",
              borderRadius: "8px",
              border: `1px solid ${saveStatus.state === "error" ? "#7E3A33" : "#E4DECC"}`,
              fontSize: "12.5px",
              fontWeight: 600,
              color: saveStatus.state === "error" ? "#7E3A33" : "#262922",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {saveStatus.state === "saving"
              ? "Saving…"
              : saveStatus.state === "error"
                ? "Retry save"
                : saveStatus.state === "saved"
                  ? "Saved ✓"
                  : "Save"}
          </div>
          <div
            onClick={() => void handleDeploy()}
            style={{
              cursor: published || deploying ? "default" : "pointer",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "none",
              background: "#3C4A3A",
              color: "#FAF8F0",
              fontSize: "12.5px",
              fontWeight: 600,
              opacity: published || deploying ? 0.7 : 1,
            }}
          >
            {published ? "Published" : deploying ? "Publishing…" : "Publish"}
          </div>
        </div>

        {/* Config sections — jump straight to one part of the config instead
            of hunting through a single long drawer. */}
        <div style={{ display: "flex", gap: "6px" }}>
          {SETTINGS_SECTIONS.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                setSettingsSection(s.id);
                setNotebookSettingsOpen(true);
              }}
              title={s.hint}
              style={{
                flex: 1,
                textAlign: "center",
                whiteSpace: "nowrap",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: "999px",
                border: "1px solid #E4DECC",
                background: "#FFFDF9",
                fontSize: "11.5px",
                fontWeight: 600,
                color: "#55594D",
              }}
            >
              {s.label}
            </div>
          ))}
        </div>

        <div
          style={{
            fontSize: "11.5px",
            color: "#8A9488",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            paddingLeft: "2px",
          }}
        >
          {clusterIds.length > 0
            ? `Sources: ${clusterIds.map(clusterName).join(", ")}`
            : "No clusters yet"}
          {published && (
            <>
              {" · "}
              <a
                href={`${MARKETPLACE_URL}/${row.slug}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#4B6B49", fontWeight: 600 }}
              >
                /{row.slug}
              </a>
            </>
          )}
        </div>
        <SaveStatusRow status={saveStatus} />
      </div>

      {/* Sources drawer — platforms (whole connections) and clusters */}
      {sourcesOpen && (
        <SourcesDrawer
          category={sourcesCategory}
          onCategoryChange={setSourcesCategory}
          onClose={() => setSourcesOpen(false)}
          selectedSources={activeBlock?.sources ?? []}
          onToggleSource={handleToggleSource}
          clusters={topics ?? []}
        />
      )}

      {/* Chat panel */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          zIndex: 6,
          width: "440px",
          height: "min(640px, 75vh)",
          background: "#FAF8F0",
          border: "1px solid #E4DECC",
          borderRadius: "14px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #E4DECC",
            fontSize: "12px",
            fontWeight: 700,
            color: focusField ? FOCUS_COLOR[focusField] : "#8A9488",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "7px",
          }}
        >
          {focusField && (
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: FOCUS_COLOR[focusField],
              }}
            />
          )}
          {focusField ? `Editing: ${FOCUS_LABEL[focusField]}` : "Converse"}
        </div>
        <div style={{ flex: 1, minHeight: 0, padding: "10px 12px" }}>
          <Chat
            key={row.id}
            config={{
              mode: "dashboard",
              notebookId: row.id,
              placeholder: chatPlaceholder,
              allowedSources: clusterIds.map((cid) => `topic:${cid}`),
              useOuroboros: useOuroborosNow,
              model,
              hideModelSwitcher: true,
            }}
            onCommand={handleChatCommand}
            quickPrompts={chatQuickPrompts}
          />
        </div>
      </div>

      {/* Notebook settings drawer */}
      {notebookSettingsOpen && (
        <NotebookSettingsDrawer
          name={nbName}
          ceiling={ceiling}
          persona={persona}
          modelTier={modelTier}
          memory={memory}
          appType={appType}
          published={published}
          slug={row.slug}
          notebookId={row.id}
          section={settingsSection}
          onSectionChange={setSettingsSection}
          marketplace={marketplaceMeta}
          onMarketplaceChange={setMarketplaceMeta}
          blockId={activeBlock?.id ?? null}
          deploying={deploying}
          floorLabel={floorLabel}
          clusterNames={clusterIds.map(clusterName).join(", ")}
          proposal={proposal?.entity === "notebook" ? proposal : null}
          refusedMessage={refusedMessage}
          focusField={focusField}
          onClose={() => {
            setNotebookSettingsOpen(false);
            setProposal(null);
            setRefusedMessage(null);
            setRedirectFocus(null);
          }}
          onRename={handleRename}
          onCeilingChange={(target) =>
            applyCeilingChange("notebook", row.id, target)
          }
          onToggleChecked={() =>
            setProposal((p) => (p ? { ...p, checked: !p.checked } : p))
          }
          onConfirm={confirmProposal}
          onCancel={() => setProposal(null)}
          onDeploy={() => void handleDeploy()}
          onSlugSave={handleSlugSave}
          onPersonaChange={(text) => {
            if (activeBlock) setTemplatedInput(activeBlock.id, "instructions", text);
          }}
          onMemoryChange={(mode) =>
            setCanvasMeta((m) => (m ? { ...m, memory: mode } : m))
          }
          onModelTierChange={applyModelTier}
        />
      )}

      {/* Cluster detail drawer */}
      {selectedCluster && (
        <ClusterDetailDrawer
          name={selectedCluster.label}
          clusterId={selectedCluster.topic_id}
          docCount={selectedCluster.doc_count}
          subCount={
            (topics ?? []).filter(
              (t) => t.parent_topic_id === selectedCluster.topic_id,
            ).length
          }
          ceiling={getCeiling(selectedCluster.topic_id)}
          dependents={dependentsOf(selectedCluster.topic_id).map((n) => n.name)}
          removable={clusterIds.includes(selectedCluster.topic_id)}
          proposal={
            proposal?.entity === "cluster" &&
            proposal.id === selectedCluster.topic_id
              ? proposal
              : null
          }
          onClose={() => {
            setSelectedClusterId(null);
            setProposal(null);
          }}
          onCeilingChange={(target) =>
            applyCeilingChange("cluster", selectedCluster.topic_id, target)
          }
          onToggleChecked={() =>
            setProposal((p) => (p ? { ...p, checked: !p.checked } : p))
          }
          onConfirm={confirmProposal}
          onCancel={() => setProposal(null)}
          onRemoveFromNotebook={() => {
            if (activeBlock)
              toggleSource(activeBlock.id, `topic:${selectedCluster.topic_id}`);
            setSelectedClusterId(null);
          }}
          onBuildNotebook={() => {
            setSelectedClusterId(null);
            void handleCreateNotebook({
              name: `${selectedCluster.label} Notebook`,
              clusterIds: [selectedCluster.topic_id],
              ceiling: getCeiling(selectedCluster.topic_id),
            });
          }}
        />
      )}
    </div>
  );
}

/* ── Save status row ───────────────────────────────────────────────── */

function SaveStatusRow({
  status,
}: {
  status:
    | { state: "idle" }
    | { state: "saving" }
    | { state: "saved" }
    | { state: "error"; message: string };
}) {
  if (status.state === "idle") return null;

  const dot =
    status.state === "saving" ? "#C99A5C" : status.state === "saved" ? "#4B6B49" : "#7E3A33";
  const text =
    status.state === "saving"
      ? "Saving…"
      : status.state === "saved"
        ? "All changes saved"
        : status.message;
  const color = status.state === "error" ? "#7E3A33" : "#8A9488";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        fontSize: "11.5px",
        color,
        paddingLeft: "2px",
        lineHeight: 1.4,
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
          ...(status.state === "saving"
            ? { animation: "pulseSync 1.4s infinite" }
            : {}),
        }}
      />
      <span>{text}</span>
    </div>
  );
}

/* ── Cluster card ──────────────────────────────────────────────────── */

function ClusterCard({
  name,
  docCount,
  ceiling,
  onClick,
}: {
  name: string;
  docCount: number;
  ceiling: Ceiling;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        width: "210px",
        cursor: "pointer",
        userSelect: "none",
        background: "#FAF8F0",
        border: "1px solid #E4DECC",
        borderRadius: "14px",
        padding: "16px 17px",
        boxShadow: "0 2px 8px rgba(60,74,58,0.08)",
      }}
    >
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: CEILING_DOT[ceiling],
          marginBottom: "9px",
        }}
      />
      <div
        style={{
          fontFamily: "var(--font-source-serif), serif",
          fontWeight: 600,
          fontSize: "15px",
          marginBottom: "5px",
          lineHeight: 1.3,
          color: "#262922",
        }}
      >
        {name}
      </div>
      <div style={{ fontSize: "11.5px", color: "#8A9488" }}>
        {docCount} docs
      </div>
    </div>
  );
}

/* ── Ceiling confirmation flow (shared by both drawers) ───────────── */

function CeilingConfirm({
  consequence,
  checked,
  onToggleChecked,
  onConfirm,
  onCancel,
}: {
  consequence: string;
  checked: boolean;
  onToggleChecked: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        marginTop: "10px",
        border: "1px dashed #C99A5C",
        background: "#FBF3E4",
        borderRadius: "9px",
        padding: "12px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          color: "#262922",
          marginBottom: "10px",
          lineHeight: 1.5,
        }}
      >
        {consequence}
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          fontSize: "12.5px",
          color: "#55594D",
          cursor: "pointer",
          marginBottom: "10px",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggleChecked}
          style={{ marginTop: "2px" }}
        />
        <span>I understand the consequence and want to proceed.</span>
      </label>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={onConfirm}
          disabled={!checked}
          style={{
            cursor: checked ? "pointer" : "default",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background: checked ? "#3C4A3A" : "#B7BDB0",
            color: "#FAF8F0",
            fontWeight: 600,
            fontSize: "12.5px",
          }}
        >
          Apply change
        </button>
        <button
          onClick={onCancel}
          style={{
            cursor: "pointer",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid #E4DECC",
            background: "transparent",
            fontWeight: 600,
            fontSize: "12.5px",
            color: "#55594D",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Cluster detail drawer ─────────────────────────────────────────── */

function ClusterDetailDrawer({
  name,
  clusterId,
  docCount,
  subCount,
  ceiling,
  dependents,
  removable,
  proposal,
  onClose,
  onCeilingChange,
  onToggleChecked,
  onConfirm,
  onCancel,
  onRemoveFromNotebook,
  onBuildNotebook,
}: {
  name: string;
  clusterId: string;
  docCount: number;
  subCount: number;
  ceiling: Ceiling;
  dependents: string[];
  removable: boolean;
  proposal: Proposal | null;
  onClose: () => void;
  onCeilingChange: (target: Ceiling) => void;
  onToggleChecked: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRemoveFromNotebook: () => void;
  onBuildNotebook: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(38,41,34,0.28)",
          zIndex: 20,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "440px",
          background: "#FAF8F0",
          borderLeft: "1px solid #E4DECC",
          zIndex: 21,
          padding: "26px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.08)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "3px 9px",
                borderRadius: "20px",
                display: "inline-block",
                marginBottom: "8px",
                background: CEILING_BG[ceiling],
                color: CEILING_COLOR[ceiling],
              }}
            >
              {CEILING_LABEL[ceiling]}
            </div>
            <div
              style={{
                fontFamily: "var(--font-source-serif), serif",
                fontWeight: 600,
                fontSize: "20px",
                color: "#262922",
              }}
            >
              {name}
            </div>
          </div>
          <div
            onClick={onClose}
            style={{ cursor: "pointer", color: "#8A9488", fontSize: "18px" }}
          >
            ✕
          </div>
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "#55594D",
            display: "flex",
            gap: "16px",
          }}
        >
          <span>{docCount} documents</span>
          <span>{subCount} sub-clusters</span>
        </div>

        <div style={{ borderTop: "1px solid #E4DECC", paddingTop: "14px" }}>
          <SectionLabel text="Ceiling (source of truth)" />
          <select
            value={ceiling}
            onChange={(e) => onCeilingChange(e.target.value as Ceiling)}
            style={{
              fontFamily: "var(--font-albert-sans), sans-serif",
              fontSize: "13px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid #E4DECC",
              background: "#FAF8F0",
              color: "#262922",
            }}
          >
            <option value="private">Private</option>
            <option value="team" disabled>
              Team (coming soon)
            </option>
            <option value="public">Public-eligible</option>
          </select>
          {proposal && (
            <CeilingConfirm
              consequence={`Widening to ${CEILING_LABEL[proposal.target]} makes this cluster's contents reachable more broadly — its ACL still governs who can actually see it.`}
              checked={proposal.checked}
              onToggleChecked={onToggleChecked}
              onConfirm={onConfirm}
              onCancel={onCancel}
            />
          )}
        </div>

        <a
          href={`/workspace?cluster=${encodeURIComponent(clusterId)}`}
          style={{
            fontSize: "12.5px",
            fontWeight: 600,
            color: "#7E3A33",
            textDecoration: "none",
          }}
        >
          View documents in Knowledge Map →
        </a>

        <div style={{ borderTop: "1px solid #E4DECC", paddingTop: "14px" }}>
          <SectionLabel text="Depends on this cluster" />
          <div style={{ fontSize: "13px", color: "#262922" }}>
            {dependents.length ? dependents.join(", ") : "None yet"}
          </div>
        </div>

        <div style={{ flex: 1 }} />
        {removable && (
          <button
            onClick={onRemoveFromNotebook}
            style={{
              cursor: "pointer",
              padding: "12px 14px",
              borderRadius: "9px",
              border: "1px solid #E4DECC",
              background: "#FAF8F0",
              fontFamily: "var(--font-albert-sans), sans-serif",
              fontWeight: 600,
              fontSize: "13.5px",
              textAlign: "left",
              color: "#7E3A33",
            }}
          >
            Remove from this notebook
          </button>
        )}
        <button
          onClick={onBuildNotebook}
          style={{
            cursor: "pointer",
            padding: "12px 14px",
            borderRadius: "9px",
            border: "none",
            background: "#3C4A3A",
            color: "#FAF8F0",
            fontFamily: "var(--font-albert-sans), sans-serif",
            fontWeight: 600,
            fontSize: "13.5px",
            textAlign: "left",
          }}
        >
          Build a notebook from this cluster →
        </button>
      </div>
    </>
  );
}

/* ── Notebook settings drawer ──────────────────────────────────────── */

function NotebookSettingsDrawer({
  name,
  ceiling,
  persona,
  modelTier,
  memory,
  appType,
  published,
  slug,
  notebookId,
  section,
  onSectionChange,
  marketplace,
  onMarketplaceChange,
  blockId,
  deploying,
  floorLabel,
  clusterNames,
  proposal,
  refusedMessage,
  focusField,
  onClose,
  onRename,
  onCeilingChange,
  onToggleChecked,
  onConfirm,
  onCancel,
  onDeploy,
  onSlugSave,
  onPersonaChange,
  onMemoryChange,
  onModelTierChange,
}: {
  name: string;
  ceiling: Ceiling;
  persona: string;
  modelTier: ModelTier;
  memory: MemoryMode;
  appType: AppType | null;
  published: boolean;
  slug: string | null;
  notebookId: string;
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  marketplace: MarketplaceMeta;
  onMarketplaceChange: (meta: MarketplaceMeta) => void;
  blockId: string | null;
  deploying: boolean;
  floorLabel: string;
  clusterNames: string;
  proposal: Proposal | null;
  refusedMessage: string | null;
  focusField: FocusField | null;
  onClose: () => void;
  onRename: (name: string) => void;
  onCeilingChange: (target: Ceiling) => void;
  onToggleChecked: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onDeploy: () => void;
  onSlugSave: (slug: string) => Promise<string | null>;
  onPersonaChange: (persona: string) => void;
  onMemoryChange: (memory: MemoryMode) => void;
  onModelTierChange: (tier: ModelTier) => void;
}) {
  // Tuning + appearance read/write the shared store directly (same pattern
  // as BlueprintDesigner) rather than threading a dozen more props through.
  const { blocks: storeBlocks, setStateSetting, theme, setTheme } = useNotebookStore();
  const compute = blockId ? storeBlocks[blockId] : null;
  const creativity = (compute?.stateSettings?.creativity as number) ?? 0.5;
  const maxTokens = (compute?.stateSettings?.maxTokens as number) ?? 1000;
  const resultLimit = (compute?.stateSettings?.limit as number) ?? 5;
  const [nameDraft, setNameDraft] = useState(name);
  const [slugDraft, setSlugDraft] = useState(slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugSaved, setSlugSaved] = useState(false);

  // Keep drafts in sync with the canonical prop — covers both an external
  // rename (e.g. the chat assistant's "rename to X" command) and the slug
  // being re-sanitized server-side (renameSlug lowercases/strips characters,
  // so the saved value can differ slightly from what was typed).
  useEffect(() => setNameDraft(name), [name]);
  useEffect(() => setSlugDraft(slug ?? ""), [slug]);

  const handleSlugSave = async () => {
    if (!slugDraft.trim() || slugDraft === slug) return;
    setSlugSaving(true);
    setSlugError(null);
    const err = await onSlugSave(slugDraft);
    setSlugSaving(false);
    if (err) {
      setSlugError(err);
    } else {
      setSlugSaved(true);
      setTimeout(() => setSlugSaved(false), 2000);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(38,41,34,0.28)",
          zIndex: 20,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "440px",
          background: "#FAF8F0",
          borderLeft: "1px solid #E4DECC",
          zIndex: 21,
          padding: "26px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.08)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-source-serif), serif",
              fontWeight: 600,
              fontSize: "20px",
              color: "#262922",
            }}
          >
            Notebook settings
          </div>
          <div
            onClick={onClose}
            style={{ cursor: "pointer", color: "#8A9488", fontSize: "18px" }}
          >
            ✕
          </div>
        </div>

        {/* Section tabs — one part of the config at a time. */}
        <div style={{ display: "flex", gap: "5px" }}>
          {SETTINGS_SECTIONS.map((s) => {
            const active = s.id === section;
            return (
              <div
                key={s.id}
                onClick={() => onSectionChange(s.id)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  padding: "6px 8px",
                  borderRadius: "999px",
                  border: `1px solid ${active ? "#3C4A3A" : "#E4DECC"}`,
                  background: active ? "#3C4A3A" : "#FFFDF9",
                  color: active ? "#FAF8F0" : "#55594D",
                  fontSize: "11.5px",
                  fontWeight: 600,
                }}
              >
                {s.label}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: "11.5px", color: "#8A9488", marginTop: "-8px" }}>
          {SETTINGS_SECTIONS.find((s) => s.id === section)?.hint}
        </div>

        {section === "setup" && (
          <>
        <SettingsFieldCard label="Name">
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            onBlur={() => {
              const trimmed = nameDraft.trim();
              if (trimmed && trimmed !== name) onRename(trimmed);
              else setNameDraft(name);
            }}
            style={{
              width: "100%",
              fontFamily: "var(--font-source-serif), serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#262922",
              border: "1px solid #E4DECC",
              borderRadius: "8px",
              padding: "8px 10px",
            }}
          />
        </SettingsFieldCard>

        <SettingsFieldCard label="Effective ceiling">
          <div style={{ fontSize: "14px", color: "#262922", lineHeight: 1.5 }}>
            {CEILING_LABEL[ceiling]}
          </div>
          <div style={{ fontSize: "12px", color: "#8A9488", marginTop: "3px" }}>
            Capped at {floorLabel} by its linked clusters. May be narrowed
            further anytime.
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "9px" }}>
            {(["private", "team", "public"] as Ceiling[]).map((c) => {
              const locked = c === "team";
              return (
                <button
                  key={c}
                  disabled={locked}
                  title={locked ? "Team — coming soon" : undefined}
                  onClick={() => {
                    if (locked) return;
                    onCeilingChange(c);
                  }}
                  style={{
                    cursor: locked ? "not-allowed" : "pointer",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    opacity: locked ? 0.5 : 1,
                    background: ceiling === c ? CEILING_BG[c] : "transparent",
                    color: ceiling === c ? CEILING_COLOR[c] : "#8A9488",
                    border: `1px solid ${ceiling === c ? CEILING_COLOR[c] + "55" : "#E4DECC"}`,
                  }}
                >
                  {CEILING_LABEL[c]}
                </button>
              );
            })}
          </div>
          {proposal && (
            <CeilingConfirm
              consequence={`Widens "${name}" from ${CEILING_LABEL[ceiling]} to ${CEILING_LABEL[proposal.target]}.`}
              checked={proposal.checked}
              onToggleChecked={onToggleChecked}
              onConfirm={onConfirm}
              onCancel={onCancel}
            />
          )}
          {!proposal && refusedMessage && (
            <div
              style={{
                fontSize: "12.5px",
                color: "#7E3A33",
                marginTop: "9px",
                lineHeight: 1.5,
              }}
            >
              {refusedMessage}
            </div>
          )}
        </SettingsFieldCard>

        <SettingsFieldCard
          label="ACL"
          highlight={focusField === "acl" ? FOCUS_COLOR.acl : undefined}
        >
          <div style={{ fontSize: "14px", color: "#262922", lineHeight: 1.5 }}>
            Owner only
          </div>
          {focusField === "acl" && (
            <div
              style={{ fontSize: "12px", color: "#8A9488", marginTop: "3px" }}
            >
              Not configurable yet — depends on Teams &amp; Permissions.
            </div>
          )}
        </SettingsFieldCard>

        <SettingsFieldCard
          label="Sources (clusters feeding it)"
          highlight={focusField === "sources" ? FOCUS_COLOR.sources : undefined}
        >
          <div style={{ fontSize: "14px", color: "#262922", lineHeight: 1.5 }}>
            {clusterNames || "None yet"}
          </div>
        </SettingsFieldCard>

        <SettingsFieldCard
          label="Persona / instructions"
          highlight={focusField === "persona" ? FOCUS_COLOR.persona : undefined}
        >
          <textarea
            value={persona}
            onChange={(e) => onPersonaChange(e.target.value)}
            rows={3}
            placeholder="Describe how this notebook should sound…"
            style={{
              width: "100%",
              resize: "vertical",
              fontFamily: "var(--font-albert-sans), sans-serif",
              fontSize: "14px",
              color: "#262922",
              lineHeight: 1.5,
              border: "1px solid #E4DECC",
              borderRadius: "8px",
              padding: "8px 10px",
            }}
          />
        </SettingsFieldCard>

        <SettingsFieldCard
          label="Model"
          highlight={focusField === "model" ? FOCUS_COLOR.model : undefined}
        >
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {MODEL_TIER_OPTIONS.map((m) => (
              <button
                key={m.id}
                onClick={() => onModelTierChange(m.id)}
                style={{
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: modelTier === m.id ? "#EDEAF7" : "transparent",
                  color: modelTier === m.id ? "#6B7FD7" : "#8A9488",
                  border: `1px solid ${modelTier === m.id ? "#6B7FD755" : "#E4DECC"}`,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </SettingsFieldCard>

        {appType === "search" && blockId && (
          <SettingsFieldCard
            label="Result card"
            highlight={focusField === "schema" ? FOCUS_COLOR.schema : undefined}
          >
            <div
              style={{ fontSize: "12px", color: "#8A9488", marginBottom: "8px" }}
            >
              Design what each search result shows to end users.
            </div>
            <BlueprintDesigner blockId={blockId} mode="panel" />
          </SettingsFieldCard>
        )}

        <SettingsFieldCard
          label="Memory / chat behavior"
          highlight={focusField === "memory" ? FOCUS_COLOR.memory : undefined}
        >
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {MEMORY_OPTIONS.map((m) => (
              <button
                key={m.id}
                disabled={m.locked}
                title={m.locked ? "Priced feature — coming soon" : undefined}
                onClick={() => {
                  if (m.locked) return;
                  onMemoryChange(m.id);
                }}
                style={{
                  cursor: m.locked ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  opacity: m.locked ? 0.5 : 1,
                  background: memory === m.id ? "#EDE9F5" : "transparent",
                  color: memory === m.id ? "#8A7FCB" : "#8A9488",
                  border: `1px solid ${memory === m.id ? "#8A7FCB55" : "#E4DECC"}`,
                }}
              >
                {m.label}
                {m.locked && (
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "#9C6B2E",
                      background: "#F7ECDC",
                      borderRadius: "8px",
                      padding: "1px 6px",
                    }}
                  >
                    Priced
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ fontSize: "12px", color: "#8A9488", marginTop: "8px" }}>
            No memory by default — each conversation starts fresh. Remembering
            context across messages or sessions is a paid feature, coming soon.
          </div>
        </SettingsFieldCard>

          </>
        )}

        {section === "look" && (
          <>
          <SettingsFieldCard label="App name (shown to visitors)">
            <input
              value={theme.appLabel}
              onChange={(e) => setTheme({ appLabel: e.target.value })}
              style={{
                width: "100%",
                fontFamily: "var(--font-albert-sans), sans-serif",
                fontSize: "14px",
                color: "#262922",
                border: "1px solid #E4DECC",
                borderRadius: "8px",
                padding: "8px 10px",
              }}
            />
          </SettingsFieldCard>
          <SettingsFieldCard label="Colors">
            <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#55594D", cursor: "pointer" }}>
                <input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => setTheme({ primaryColor: e.target.value })}
                  style={{ width: "28px", height: "28px", border: "1px solid #E4DECC", borderRadius: "6px", padding: 0, cursor: "pointer" }}
                />
                Accent
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#55594D", cursor: "pointer" }}>
                <input
                  type="color"
                  value={theme.backgroundColor}
                  onChange={(e) => setTheme({ backgroundColor: e.target.value })}
                  style={{ width: "28px", height: "28px", border: "1px solid #E4DECC", borderRadius: "6px", padding: 0, cursor: "pointer" }}
                />
                Background
              </label>
            </div>
          </SettingsFieldCard>
          <SettingsFieldCard label="Poysis banner">
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "#262922", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={theme.showBanner}
                onChange={(e) => setTheme({ showBanner: e.target.checked })}
              />
              Show the &quot;Powered by Poysis&quot; banner on the public app
            </label>
          </SettingsFieldCard>
          </>
        )}

        {section === "tuning" && (
          <>
          {appType !== "search" && (
            <>
              <SettingsFieldCard label="Creativity">
                <SliderRow
                  value={creativity}
                  min={0}
                  max={1}
                  step={0.1}
                  display={creativity.toFixed(1)}
                  leftLabel="Sticks to facts"
                  rightLabel="More creative"
                  onChange={(v) => blockId && setStateSetting(blockId, "creativity", v)}
                />
              </SettingsFieldCard>
              <SettingsFieldCard label="Response length">
                <SliderRow
                  value={maxTokens}
                  min={50}
                  max={2048}
                  step={50}
                  display={`${maxTokens}`}
                  leftLabel="Short"
                  rightLabel="Long"
                  onChange={(v) => blockId && setStateSetting(blockId, "maxTokens", v)}
                />
              </SettingsFieldCard>
            </>
          )}
          {appType === "search" && (
            <SettingsFieldCard label="Results per search">
              <SliderRow
                value={resultLimit}
                min={1}
                max={20}
                step={1}
                display={`${resultLimit}`}
                leftLabel="Just the best match"
                rightLabel="Cast a wide net"
                onChange={(v) => blockId && setStateSetting(blockId, "limit", v)}
              />
            </SettingsFieldCard>
          )}
          </>
        )}

        {section === "listing" && (
          <>
            <MarketplaceFields
              notebookId={notebookId}
              meta={marketplace}
              onChange={onMarketplaceChange}
            />

        <SettingsFieldCard label="Link">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "14px", color: "#8A9488", flexShrink: 0 }}>/</span>
            <input
              value={slugDraft}
              onChange={(e) => {
                setSlugDraft(e.target.value);
                setSlugError(null);
                setSlugSaved(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                  handleSlugSave();
                }
              }}
              onBlur={handleSlugSave}
              placeholder="your-notebook-name"
              style={{
                flex: 1,
                minWidth: 0,
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "13px",
                color: "#262922",
                border: "1px solid #E4DECC",
                borderRadius: "8px",
                padding: "7px 10px",
              }}
            />
          </div>
          {slugError && (
            <div style={{ fontSize: "12px", color: "#7E3A33", marginTop: "6px" }}>
              {slugError}
            </div>
          )}
          {slugSaved && (
            <div style={{ fontSize: "12px", color: "#4B6B49", marginTop: "6px" }}>
              ✓ Saved
            </div>
          )}
          {published && slug ? (
            <div style={{ fontSize: "12.5px", color: "#8A9488", marginTop: "9px" }}>
              Live at{" "}
              <a
                href={`${MARKETPLACE_URL}/${slug}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#4B6B49", fontWeight: 600 }}
              >
                /{slug}
              </a>
            </div>
          ) : (
            <button
              onClick={onDeploy}
              disabled={deploying || slugSaving}
              style={{
                cursor: deploying ? "default" : "pointer",
                marginTop: "9px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                background: "#3C4A3A",
                color: "#FAF8F0",
                fontWeight: 600,
                fontSize: "12.5px",
                opacity: deploying ? 0.7 : 1,
              }}
            >
              {deploying ? "Publishing…" : "Auto-generate & publish"}
            </button>
          )}
        </SettingsFieldCard>
          </>
        )}
      </div>
    </>
  );
}

function SliderRow({
  value,
  min,
  max,
  step,
  display,
  leftLabel,
  rightLabel,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  leftLabel: string;
  rightLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontSize: "11.5px",
            fontWeight: 600,
            color: "#3C4A3A",
            background: "#EDF1E9",
            border: "1px solid #E4DECC",
            borderRadius: "6px",
            padding: "1px 7px",
          }}
        >
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#3C4A3A", cursor: "pointer" }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "4px",
          fontSize: "11px",
          color: "#8A9488",
        }}
      >
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

function SettingsFieldCard({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: string;
}) {
  return (
    <div
      style={{
        background: "#FAF8F0",
        border: `1px solid ${highlight ?? "#E4DECC"}`,
        borderLeft: highlight ? `3px solid ${highlight}` : "1px solid #E4DECC",
        borderRadius: "12px",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "#8A9488",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "#8A9488",
        marginBottom: "8px",
      }}
    >
      {text}
    </div>
  );
}
