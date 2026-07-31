"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isActive,
  isStalled,
  type ConsolidationJob,
  type ConsolidationPhase,
} from "@/lib/consolidationJob";
import { fetchLatestJob, subscribeToJobs } from "@/lib/consolidationStatus";

/**
 * Live consolidation progress for the Studio bottom pane, read from Supabase.
 *
 * The newest `consolidation_jobs` row for the workspace *is* the live bar.
 * Realtime pushes each write as it lands; a poll runs alongside it so the bar
 * still moves when Realtime isn't enabled for the table, and the status route
 * backs up the direct read when RLS hasn't been opened for it yet.
 *
 * This replaced an EventSource against the worker's snapshot stream. That
 * stream needed a same-origin proxy to inject `X-User-ID`, closed without
 * retrying on any network blip, and could only ever describe one run — reading
 * the table picks up a run started in another tab, or before this client
 * loaded, for free.
 */
export type { ConsolidationPhase };

export type ConsolidationProgress = {
  phase: ConsolidationPhase;
  visible: boolean;
  docsProcessed?: number;
  docsSkipped?: number;
  docsOrphaned?: number;
  vectorsIndexed?: number;
  leafTopics?: number;
  totalTopics?: number;
  indexedFiles?: number;
  youtubeChannels?: number;
  activeYoutubeChannels?: number;
  /** Running, but nothing written for a few minutes — say so, don't freeze. */
  stalled: boolean;
  updatedAt?: string;
  completedAt?: string;
  error?: string;
  /** The workspace whose rows we're reading; the stable bar needs it too. */
  workspaceId: string | null;
};

type StatusRouteResponse = {
  workspaceId?: string | null;
  job?: ConsolidationJob | null;
  lastCompletedJob?: ConsolidationJob | null;
  indexedFiles?: number;
  youtubeChannels?: number;
  activeYoutubeChannels?: number;
};

const HIDDEN: ConsolidationProgress = {
  phase: "idle",
  visible: false,
  stalled: false,
  workspaceId: null,
};

const JOB_STORAGE_KEY = "pz-consolidation-last-job";
const LATEST_JOB = "__latest__";

/** How often to re-read the job row while a run is in flight, and while idle. */
const ACTIVE_POLL_MS = 4_000;
const IDLE_POLL_MS = 30_000;
/** Side counts (indexed files, channels) only move when a run finishes. */
const SIDE_COUNT_POLL_MS = 30_000;

/**
 * On a cold load the newest row may be a run that finished long ago. Reveal it
 * only if it just settled — otherwise every visit to Studio would open with a
 * "your notebook is ready" pane about last week's run.
 */
const RECENT_SETTLE_MS = 2 * 60_000;

/** How long a started run may go without producing a row before we call it. */
const NOT_STARTED_AFTER_MS = 45_000;

function saveWatchedJob(jobId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    // A job id keeps the pane pinned to the run this browser started, however
    // long ago it settled. Without one, following the workspace's latest run
    // is still better than dropping the pane altogether.
    sessionStorage.setItem(JOB_STORAGE_KEY, jobId ?? LATEST_JOB);
  } catch {
    // Private browsing / disabled storage: progress still works for this view.
  }
}

function readWatchedJob(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(JOB_STORAGE_KEY);
    return !value || value === LATEST_JOB ? null : value;
  } catch {
    return null;
  }
}

/** Did this browser start the run we're looking at, or did it just settle? */
function shouldReveal(job: ConsolidationJob, watchedJobId: string | null) {
  if (isActive(job)) return true;
  if (watchedJobId && job.id === watchedJobId) return true;
  const settled = Date.parse(job.completedAt ?? job.updatedAt ?? "");
  return Number.isFinite(settled) && Date.now() - settled < RECENT_SETTLE_MS;
}

export function useConsolidationProgress() {
  const [state, setState] = useState<ConsolidationProgress>(HIDDEN);

  const hiddenRef = useRef(false);
  const workspaceIdRef = useRef<string | null>(null);
  const watchedJobIdRef = useRef<string | null>(null);
  /**
   * Set while a run has been started but no row for it has been read yet. Until
   * one arrives, the newest row still describes the *previous* run, so applying
   * it would flip the pane straight back to "ready" a beat after the user asked
   * for a new sync.
   */
  const awaitingRunRef = useRef(false);
  /** Bumped by `watch()` so the not-started timer re-arms on every start. */
  const [watchNonce, setWatchNonce] = useState(0);

  const applyJob = useCallback((job: ConsolidationJob | null) => {
    if (!job) return;

    if (awaitingRunRef.current) {
      const isTheRunWeStarted =
        isActive(job) || (watchedJobIdRef.current != null && job.id === watchedJobIdRef.current);
      if (!isTheRunWeStarted) return;
      awaitingRunRef.current = false;
    }

    const reveal = shouldReveal(job, watchedJobIdRef.current);

    setState((current) => ({
      ...current,
      phase: job.phase,
      // Never re-open a pane the user dismissed, and never surface a run this
      // browser has no reason to care about.
      visible: reveal && !hiddenRef.current,
      docsProcessed: job.docsProcessed ?? current.docsProcessed,
      docsSkipped: job.docsSkipped ?? current.docsSkipped,
      docsOrphaned: job.docsOrphaned ?? current.docsOrphaned,
      vectorsIndexed: job.vectorsIndexed ?? current.vectorsIndexed,
      leafTopics: job.leafTopics ?? current.leafTopics,
      totalTopics: job.totalTopics ?? current.totalTopics,
      stalled: isStalled(job),
      updatedAt: job.updatedAt ?? current.updatedAt,
      completedAt: job.completedAt ?? current.completedAt,
      error: job.phase === "failed" ? (job.error ?? "Consolidation failed") : undefined,
    }));
  }, []);

  /**
   * Read the newest job row. Supabase-direct first; the status route covers the
   * case where the browser can't see the table (no RLS select policy yet).
   */
  const refreshJob = useCallback(async () => {
    const workspaceId = workspaceIdRef.current;
    if (workspaceId) {
      const direct = await fetchLatestJob(workspaceId);
      if (direct.ok) {
        applyJob(direct.job);
        return;
      }
    }

    try {
      const res = await fetch("/api/worker/consolidation/status", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as StatusRouteResponse;
      if (data.workspaceId) workspaceIdRef.current = data.workspaceId;
      applyJob(data.job ?? null);
    } catch {
      // Leave the last rendered state on screen — the run continues regardless.
    }
  }, [applyJob]);

  /**
   * Workspace id plus the counts that don't live on the job row. The workspace
   * id has to come from the server: it's derived from the session user, and
   * it's what every direct query filters on.
   */
  const refreshContext = useCallback(async () => {
    try {
      const res = await fetch("/api/worker/consolidation/status", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as StatusRouteResponse;
      if (data.workspaceId) workspaceIdRef.current = data.workspaceId;
      setState((current) => ({
        ...current,
        workspaceId: data.workspaceId ?? current.workspaceId,
        indexedFiles: data.indexedFiles ?? current.indexedFiles,
        youtubeChannels: data.youtubeChannels ?? current.youtubeChannels,
        activeYoutubeChannels: data.activeYoutubeChannels ?? current.activeYoutubeChannels,
      }));
      applyJob(data.job ?? null);
    } catch {
      // Keep whatever we already showed.
    }
  }, [applyJob]);

  const dismiss = useCallback(() => {
    hiddenRef.current = true;
    setState((current) => ({ ...current, visible: false }));
  }, []);

  const show = useCallback(() => {
    hiddenRef.current = false;
    setState((current) => ({ ...current, visible: current.phase !== "idle" }));
  }, []);

  /**
   * Follow a run that was just started. `jobId` comes from the POST that kicked
   * it off; passing it keeps the pane pinned to that run once it settles, and
   * lets us recognise its row before the status flips to running.
   */
  const watch = useCallback(
    (jobId?: string | null) => {
      hiddenRef.current = false;
      watchedJobIdRef.current = jobId ?? null;
      awaitingRunRef.current = true;
      saveWatchedJob(jobId);
      setWatchNonce((n) => n + 1);

      setState((current) => ({
        ...current,
        phase: "running",
        visible: true,
        stalled: false,
        error: undefined,
        // Counters belong to the new run, not the one that just ended.
        docsProcessed: undefined,
        docsSkipped: undefined,
        docsOrphaned: undefined,
        vectorsIndexed: undefined,
        completedAt: undefined,
      }));

      void refreshJob();
    },
    [refreshJob],
  );

  // Restore the pane after a refresh: consolidation continues server-side, so
  // losing the browser view must not make a run look lost.
  useEffect(() => {
    watchedJobIdRef.current = readWatchedJob();
    void refreshContext();
  }, [refreshContext]);

  // Realtime: every write to the workspace's jobs lands here within a beat.
  useEffect(() => {
    const workspaceId = state.workspaceId;
    if (!workspaceId) return;
    return subscribeToJobs(workspaceId, applyJob);
  }, [state.workspaceId, applyJob]);

  // Poll the job row — fast while a run is in flight, slow otherwise so a run
  // started in another tab still shows up here.
  const active = state.phase === "running" || state.phase === "clustering";
  useEffect(() => {
    const interval = window.setInterval(
      () => void refreshJob(),
      active ? ACTIVE_POLL_MS : IDLE_POLL_MS,
    );
    return () => window.clearInterval(interval);
  }, [active, refreshJob]);

  // Indexed-file and channel counts only change when a run finishes, so they
  // ride a slow timer of their own rather than the fast job poll.
  useEffect(() => {
    const interval = window.setInterval(() => void refreshContext(), SIDE_COUNT_POLL_MS);
    return () => window.clearInterval(interval);
  }, [refreshContext]);

  // A start that never produced a job row: say so rather than spinning forever.
  useEffect(() => {
    if (!watchNonce) return;
    const timer = window.setTimeout(() => {
      if (!awaitingRunRef.current) return;
      awaitingRunRef.current = false;
      setState((current) =>
        current.phase === "running"
          ? {
              ...current,
              phase: "not_started",
              error: "Consolidation never started. Try again.",
            }
          : current,
      );
    }, NOT_STARTED_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [watchNonce]);

  return { ...state, watch, dismiss, show };
}
