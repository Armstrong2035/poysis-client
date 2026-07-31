"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Chat } from "@/components/ui/chat/Chat";
import { MARKETPLACE_URL } from "@/lib/marketplace";
import { publishReadiness, canPublish } from "@/lib/publishReadiness";
import { unpublishNotebook } from "@/lib/actions";
import { useConsolidation } from "../workspace/ConsolidationContext";
import { useNotebooks, type NotebookRow } from "../workspace/NotebooksContext";
import { StudioSourcesPanel } from "@/components/studio/StudioSourcesPanel";
import { StudioConfigPanel, type Visibility } from "@/components/studio/StudioConfigPanel";
import { StudioPublishModal } from "@/components/studio/StudioPublishModal";
import { LockGlyph } from "@/components/studio/LockGlyph";
import { useStudioNotebook } from "@/components/studio/useStudioNotebook";
import { setUiMode } from "@/lib/actions";
import { useConsolidationProgress } from "@/app/hooks/useConsolidationProgress";
import { useNotebookSummary, hasSummaryContent } from "@/app/hooks/useNotebookSummary";
import { NotebookProof } from "@/components/studio/NotebookProof";

type StudioMode = "creator" | "enterprise";

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioInner />
    </Suspense>
  );
}

const VIS_SUMMARY: Record<Visibility, string> = {
  private: "Only you can open it.",
  link: "Anyone with the link can view — no sign-in.",
  public: "Listed publicly in the marketplace directory.",
};

function StudioInner() {
  const searchParams = useSearchParams();
  const { topics, refreshKnowledge } = useConsolidation();
  const progress = useConsolidationProgress();
  const { notebooks, createNotebook, deployNotebook, patchLocal } = useNotebooks();

  // Stable bar: what's settled in the notebook. Re-reads its totals whenever a
  // run finishes — completedAt changes even if the phase was already "done".
  const summary = useNotebookSummary({
    workspaceId: progress.workspaceId,
    topics,
    refreshKey: `${progress.phase}:${progress.completedAt ?? ""}`,
  });

  /**
   * The proof of what's been built leads the middle pane and stays there. It
   * only disappears on a notebook that has genuinely never indexed anything.
   *
   * Deliberately ignores the hook's own `visible`, which reveals only a run this
   * browser started or one that settled minutes ago — fine for a notification,
   * wrong for the thing the screen is about.
   */
  const showProof = hasSummaryContent(summary) || progress.phase !== "idle";

  const [manualNotebookId, setManualNotebookId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [toast, setToast] = useState<string>("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const paramNotebookId = searchParams.get("notebook");
  const selectedNotebookId =
    manualNotebookId ??
    (paramNotebookId && notebooks.some((n) => n.id === paramNotebookId)
      ? paramNotebookId
      : (notebooks[0]?.id ?? null));

  const nb = useStudioNotebook(selectedNotebookId);

  // Clusters need consolidation topics; fetch once if a consumer opens Studio
  // before the knowledge map has been visited.
  useEffect(() => {
    if (topics === null) refreshKnowledge();
  }, [topics, refreshKnowledge]);

  // When a snapshot finishes, pull the fresh topic map so the new clusters /
  // categories show up in the sources panel without a manual refresh.
  useEffect(() => {
    if (progress.phase === "done") refreshKnowledge();
  }, [progress.phase, refreshKnowledge]);

  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 1900);
  }, []);

  // Open a notebook: drive the UI off local state and keep the ?notebook= URL
  // in sync (so a refresh or shared link reopens the same one).
  const selectNotebook = (id: string) => {
    setManualNotebookId(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("notebook", id);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const created = await createNotebook({ name: "Untitled notebook" });
      selectNotebook(created.id);
    } catch (err) {
      console.error("Failed to create notebook:", err);
      flashToast("Couldn't create notebook");
    } finally {
      setCreating(false);
    }
  };

  // Enterprise (the workspace app) is a locked paid tier — the switch shows it
  // as such and never navigates there. Picking Creator just re-affirms the
  // current app (and keeps it as the post-login landing).
  const switchMode = (m: StudioMode) => {
    if (m === "enterprise") {
      flashToast("Enterprise is a paid plan — not available yet.");
      return;
    }
    void setUiMode("creator");
  };

  /* ── Empty state — no notebooks yet ───────────────────────────────────── */
  if (!nb.row) {
    return (
      <>
        <StudioGlobalStyles />
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#FBF9F3" }}>
          <StudioTopBar mode="creator" onMode={switchMode} left={<StudioMark />} right={null} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "18px", padding: "0 48px", textAlign: "center" }}>
            <span style={{ color: "#C99A5C", fontSize: "34px" }}>✦</span>
            <h2 style={{ fontFamily: "var(--font-source-serif), serif", fontSize: "30px", fontWeight: 600, letterSpacing: "-.02em", margin: 0, color: "#23261F" }}>
              Build your first notebook
            </h2>
            <p style={{ margin: 0, fontSize: "15px", color: "#6B6D62", maxWidth: "420px", lineHeight: 1.5 }}>
              Add a YouTube channel or a Drive, ask it anything, and publish a source-grounded page in under a minute.
            </p>
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{ fontSize: "14px", fontWeight: 700, color: "#fff", background: "#3C4A3A", borderRadius: "11px", padding: "12px 22px", opacity: creating ? 0.6 : 1 }}
            >
              {creating ? "Creating…" : "Create notebook"}
            </button>
          </div>
        </div>
      </>
    );
  }

  const { row } = nb;
  const hasSources = nb.sources.length > 0;

  // Publish-readiness (needs knowledge attached) — same gate Canvas uses.
  const readiness = publishReadiness({
    clusterCount: nb.clusterIds.length,
    hasConnectionSource: nb.hasConnectionSource,
    marketplace: nb.marketplaceMeta,
  });
  const publishAllowed = canPublish(readiness);

  const visibility: Visibility = nb.published
    ? (nb.ceiling === "public" ? "public" : "link")
    : "private";

  const shareUrl = row.slug
    ? `${MARKETPLACE_URL}/${row.slug}`
    : (typeof window !== "undefined" ? `${window.location.origin}/preview?id=${row.id}` : `/preview?id=${row.id}`);

  const savedLabel =
    nb.saveStatus.state === "saving" ? "Saving…"
    : nb.saveStatus.state === "saved" ? "Auto-saved"
    : nb.saveStatus.state === "error" ? "Save failed"
    : "Draft · saves as you go";

  /* ── Publish / visibility actions ─────────────────────────────────────── */

  const handleVisibility = (v: Visibility) => {
    if (v === "private") {
      nb.setCeiling("private");
      if (nb.published) void handleUnpublish();
      return;
    }
    nb.setCeiling(v === "public" ? "public" : "private");
    if (!nb.published) {
      if (!publishAllowed) {
        flashToast("Add a source first — answers need something to ground in.");
        return;
      }
      setPublishOpen(true);
    }
  };

  const handleConfirmPublish = async () => {
    if (publishing) return;
    if (!publishAllowed) {
      flashToast("Add a source first — answers need something to ground in.");
      return;
    }
    setPublishing(true);
    try {
      // Flush pending edits so the published notebook reflects what's on screen.
      if (nb.saveStatus.state !== "saving") await nb.persistNow();
      const res = await deployNotebook(row.id);
      if ("slug" in res) {
        flashToast("Published — your notebook is live");
        setPublishOpen(false);
      } else {
        flashToast(res.error || "Couldn't publish");
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    const err = await unpublishNotebook(row.id);
    if (err) {
      flashToast("Couldn't unpublish");
      return;
    }
    patchLocal(row.id, { slug: null });
    flashToast("Unpublished");
  };

  const handleCopy = () => {
    try {
      navigator.clipboard?.writeText(shareUrl);
    } catch {
      /* clipboard blocked — no-op */
    }
    setCopyLabel("Copied");
    flashToast("Link copied");
    window.setTimeout(() => setCopyLabel("Copy"), 1500);
  };

  const openPublish = () => {
    if (!nb.published && !publishAllowed) {
      flashToast("Add a source first — answers need something to ground in.");
      return;
    }
    setPublishOpen(true);
  };

  return (
    <>
      <StudioGlobalStyles />
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#FBF9F3" }}>
        {/* ── Top chrome ─────────────────────────────────────────────── */}
        <StudioTopBar
          mode="creator"
          onMode={switchMode}
          left={
            <>
              <StudioMark />
              <div style={{ width: "1px", height: "24px", background: "rgba(35,38,31,.12)" }} />
              <StudioNotebookMenu
                notebooks={notebooks}
                currentId={row.id}
                currentName={nb.name || "Untitled notebook"}
                onSelect={selectNotebook}
                onCreate={handleCreate}
                creating={creating}
              />
              <span style={{ fontSize: "12px", color: nb.saveStatus.state === "error" ? "#B9422F" : "#8A8C80", background: "#F0EDE3", borderRadius: "6px", padding: "3px 9px", whiteSpace: "nowrap" }}>
                {savedLabel}
              </span>
            </>
          }
          right={
            <>
              {nb.published && (
                <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", fontWeight: 600, color: "#3C4A3A", background: "#EBF0E5", border: "1px solid #DCE4D2", borderRadius: "10px", padding: "8px 14px" }}>
                  ● Published
                </div>
              )}
              {/* Sharing is locked for now: the padlock replaces the ↗ so the
                  control still reads as itself, just not yet open. Publishing is
                  untouched — only the share affordance is gated. */}
              {nb.published ? (
                <button
                  disabled
                  title="Sharing isn't available yet"
                  aria-label="Share — not available yet"
                  style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,.72)", background: "#8A8C80", borderRadius: "10px", padding: "10px 20px", cursor: "not-allowed" }}
                >
                  Share
                  <LockGlyph />
                </button>
              ) : (
                <button
                  onClick={openPublish}
                  style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "#fff", background: "#3C4A3A", borderRadius: "10px", padding: "10px 20px" }}
                >
                  Publish ↗
                </button>
              )}
            </>
          }
        />

        {/* ── Three panels ───────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <StudioSourcesPanel
            sources={nb.sources}
            onToggleSource={nb.handleToggleSource}
            clusters={topics ?? []}
            onToast={flashToast}
            onCategoriesImported={refreshKnowledge}
            onConsolidationStarted={progress.watch}
          />

          {/* Middle — what's in the notebook, then Test & Chat */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "#FBF9F3" }}>
            {showProof && (
              <div style={{ flex: "0 0 auto", padding: "18px 44px 0" }}>
                <div style={{ maxWidth: "720px", margin: "0 auto" }}>
                  <NotebookProof progress={progress} summary={summary} />
                </div>
              </div>
            )}

            {!hasSources ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 48px", textAlign: "center" }}>
                <span style={{ color: "#C99A5C", fontSize: "40px", opacity: 0.5, marginBottom: "18px" }}>✦</span>
                <h2 style={{ fontFamily: "var(--font-source-serif), serif", fontSize: "34px", fontWeight: 600, letterSpacing: "-.02em", margin: "0 0 10px", color: "#23261F" }}>
                  Add a source to begin.
                </h2>
                <p style={{ margin: 0, fontSize: "16px", color: "#6B6D62", maxWidth: "440px", lineHeight: 1.5 }}>
                  Add a YouTube channel or a Drive on the left, and Poysis grounds every answer in it — a notebook you can question, shape, and publish in under a minute.
                </p>
              </div>
            ) : (
              <>
                <div style={{ padding: "18px 44px 0", flex: "0 0 auto" }}>
                  <div style={{ maxWidth: "720px", margin: "0 auto", fontSize: "12px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#8A8C80" }}>
                    Test your notebook
                  </div>
                </div>
                <div style={{ flex: 1, minHeight: 0, padding: "8px 44px 20px" }}>
                  <div style={{ maxWidth: "720px", margin: "0 auto", height: "100%" }}>
                    <Chat
                      key={row.id}
                      config={{
                        mode: "dashboard",
                        appearance: "light",
                        notebookId: row.id,
                        allowedSources: nb.sources,
                        branding: { primaryColor: "#3C4A3A" },
                        placeholder: "Ask anything about your sources…",
                        modelTier: nb.modelTier,
                        hideModelSwitcher: true,
                      }}
                    />
                  </div>
                </div>
              </>
            )}

          </div>

          <StudioConfigPanel
            name={nb.name}
            onRename={nb.rename}
            description={nb.marketplaceMeta.tagline ?? ""}
            onDescription={(v) => nb.setMarketplaceMeta((m) => ({ ...m, tagline: v }))}
            persona={nb.persona}
            onPersona={nb.setPersona}
            modelTier={nb.modelTier}
            onModelTier={nb.setModelTier}
            memory={nb.memory}
            onMemory={nb.setMemory}
            visibility={visibility}
            onVisibility={handleVisibility}
            published={nb.published}
            publishAllowed={publishAllowed}
            shareUrl={shareUrl}
            copyLabel={copyLabel}
            onOpenPublish={openPublish}
            onCopy={handleCopy}
            onUnpublish={() => void handleUnpublish()}
          />
        </div>
      </div>

      {publishOpen && (
        <StudioPublishModal
          published={nb.published}
          publishing={publishing}
          shareUrl={shareUrl}
          copyLabel={copyLabel}
          visibilitySummary={VIS_SUMMARY[visibility]}
          onCopy={handleCopy}
          onConfirmPublish={() => void handleConfirmPublish()}
          onClose={() => setPublishOpen(false)}
          onToast={flashToast}
        />
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#23261F",
            color: "#F3F1E8",
            fontSize: "13.5px",
            fontWeight: 500,
            padding: "11px 20px",
            borderRadius: "999px",
            boxShadow: "0 16px 32px -12px rgba(0,0,0,.5)",
            zIndex: 60,
            animation: "pz-pop .2s ease",
          }}
        >
          {toast}
        </div>
      )}

    </>
  );
}

/* ── Top bar + mode switch ──────────────────────────────────────────── */

/** The ✦ mark, linking back out to the sidebar workspace. */
function StudioMark() {
  return (
    <Link href="/workspace" title="Back to workspace" style={{ color: "#C99A5C", fontSize: "20px", lineHeight: 1 }}>
      ✦
    </Link>
  );
}

/** Notebook switcher — the workspace's existing notebooks (data carries over
 * from the workspace app unchanged), plus a "New notebook" action. */
function StudioNotebookMenu({
  notebooks,
  currentId,
  currentName,
  onSelect,
  onCreate,
  creating,
}: {
  notebooks: NotebookRow[];
  currentId: string;
  currentName: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  creating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          maxWidth: "30vw",
          padding: "4px 8px",
          borderRadius: "8px",
        }}
        title="Switch notebook"
      >
        <span style={{ fontFamily: "var(--font-source-serif), serif", fontSize: "18px", fontWeight: 600, color: "#23261F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {currentName}
        </span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#8A8C80" strokeWidth="1.5" style={{ flex: "0 0 auto" }}>
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {open && (
        <div
          className="pz-scroll"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: "300px",
            maxHeight: "min(60vh, 420px)",
            overflowY: "auto",
            background: "#FBF9F3",
            border: "1px solid rgba(35,38,31,.12)",
            borderRadius: "12px",
            boxShadow: "0 20px 44px -22px rgba(35,38,31,.5)",
            padding: "8px",
            zIndex: 30,
            animation: "pz-fade .16s ease",
          }}
        >
          <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#9A9C90", padding: "6px 8px 8px" }}>
            Notebooks
          </div>
          {notebooks.map((n) => {
            const active = n.id === currentId;
            const sourceCount = (n.config?.activeBlocks?.[0]?.sources ?? []).length;
            const published = !!n.slug;
            return (
              <button
                key={n.id}
                onClick={() => { onSelect(n.id); setOpen(false); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "9px",
                  textAlign: "left",
                  background: active ? "#EBF0E5" : "transparent",
                  borderRadius: "9px",
                  padding: "9px 10px",
                }}
              >
                <span style={{ width: "8px", height: "8px", flex: "0 0 auto", marginTop: "5px", borderRadius: "999px", background: active ? "#3C4A3A" : "rgba(35,38,31,.18)" }} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: "13.5px", fontWeight: active ? 600 : 500, color: "#23261F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {n.name || "Untitled notebook"}
                  </span>
                  <span style={{ display: "block", fontSize: "11.5px", color: "#9A9C90", marginTop: "1px" }}>
                    {sourceCount} source{sourceCount === 1 ? "" : "s"} · {published ? "Published" : "Draft"}
                  </span>
                </span>
              </button>
            );
          })}
          <div style={{ borderTop: "1px solid rgba(35,38,31,.08)", marginTop: "6px", paddingTop: "6px" }}>
            <button
              onClick={() => { if (!creating) { onCreate(); setOpen(false); } }}
              disabled={creating}
              style={{
                width: "100%",
                textAlign: "left",
                fontSize: "13px",
                fontWeight: 600,
                color: "#3C4A3A",
                borderRadius: "9px",
                padding: "9px 10px",
                opacity: creating ? 0.6 : 1,
              }}
            >
              {creating ? "Creating…" : "+ New notebook"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Studio top bar: left slot, centered Creator/Enterprise switch, right slot. */
function StudioTopBar({
  mode,
  onMode,
  left,
  right,
}: {
  mode: StudioMode;
  onMode: (m: StudioMode) => void;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div
      style={{
        height: "60px",
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        borderBottom: "1px solid rgba(35,38,31,.09)",
        background: "#FBF9F3",
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "15px", minWidth: 0, flex: 1 }}>{left}</div>
      <ModeSwitch mode={mode} onMode={onMode} />
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, justifyContent: "flex-end" }}>{right}</div>
    </div>
  );
}

const MODES: { id: StudioMode; label: string; locked?: boolean }[] = [
  { id: "creator", label: "Creator" },
  // Enterprise is a paid tier — rendered locked, never navigates.
  { id: "enterprise", label: "Enterprise", locked: true },
];

function ModeSwitch({ mode, onMode }: { mode: StudioMode; onMode: (m: StudioMode) => void }) {
  return (
    <div
      style={{
        flex: "0 0 auto",
        display: "flex",
        gap: "2px",
        background: "#F0EDE3",
        border: "1px solid rgba(35,38,31,.09)",
        borderRadius: "999px",
        padding: "3px",
      }}
    >
      {MODES.map((m) => {
        const active = m.id === mode;
        const locked = !!m.locked;
        return (
          <button
            key={m.id}
            onClick={() => onMode(m.id)}
            title={locked ? "Enterprise is a paid plan — not available yet" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12.5px",
              fontWeight: 600,
              color: active ? "#23261F" : locked ? "#AEB0A4" : "#8A8C80",
              background: active ? "#fff" : "transparent",
              boxShadow: active ? "0 1px 2px rgba(35,38,31,.12)" : "none",
              borderRadius: "999px",
              padding: "6px 16px",
              whiteSpace: "nowrap",
              cursor: locked ? "not-allowed" : "pointer",
              transition: "background .15s, color .15s",
            }}
          >
            {m.label}
            {locked && (
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <rect x="2.5" y="6" width="9" height="6.5" rx="1.3" />
                <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StudioGlobalStyles() {
  return (
    <style jsx global>{`
      @keyframes pz-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      @keyframes pz-pop { from { opacity: 0; transform: scale(.96) translateY(8px); } to { opacity: 1; transform: none; } }
      @keyframes pz-spin { to { transform: rotate(360deg); } }
      @keyframes pz-dot { 0%,80%,100% { opacity:.25; } 40% { opacity:1; } }
      .pz-scroll::-webkit-scrollbar { width: 9px; }
      .pz-scroll::-webkit-scrollbar-thumb { background: rgba(35,38,31,.16); border-radius: 8px; }
      .pz-scroll::-webkit-scrollbar-track { background: transparent; }
    `}</style>
  );
}
