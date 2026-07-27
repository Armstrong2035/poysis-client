"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Live consolidation progress for the Studio bottom pane. Streams the snapshot
 * job via the same-origin proxy (/api/worker/consolidation/stream), which
 * injects X-User-ID server-side — so a plain EventSource works and we don't need
 * a fetch-based SSE client (that's only required when hitting the worker
 * directly, where EventSource can't set the header).
 *
 * Event contract (worker §5): each message is JSON with a `status`
 * (running | clustering | done | failed | not_started) and a `type`
 * (progress | complete). The stream closes itself on done/failed/not_started.
 */
export type ConsolidationPhase =
  | "idle"
  | "running"
  | "clustering"
  | "done"
  | "failed"
  | "not_started";

export type ConsolidationProgress = {
  phase: ConsolidationPhase;
  visible: boolean;
  docsProcessed?: number;
  docsSkipped?: number;
  docsOrphaned?: number;
  vectorsIndexed?: number;
  leafTopics?: number;
  totalTopics?: number;
  mcpUrl?: string;
  error?: string;
};

// Loose shape of a worker SSE event (§5) — fields vary by status/type.
type SnapshotEvent = {
  type?: string;
  status?: string;
  error?: string;
  docs_processed?: number;
  docs_skipped?: number;
  docs_orphaned?: number;
  vectors_indexed?: number;
  leaf_topics?: number;
  total_topics?: number;
  mcp_url?: string;
};

const HIDDEN: ConsolidationProgress = { phase: "idle", visible: false };

export function useConsolidationProgress() {
  const [state, setState] = useState<ConsolidationProgress>(HIDDEN);
  const esRef = useRef<EventSource | null>(null);

  const close = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  const dismiss = useCallback(() => {
    close();
    setState(HIDDEN);
  }, [close]);

  // Start streaming a snapshot run. Pass the job_id from the POST that started
  // it so we watch that exact run rather than the workspace's latest.
  const watch = useCallback(
    (jobId?: string | null) => {
      close();
      setState({ phase: "running", visible: true });

      const url = jobId
        ? `/api/worker/consolidation/stream?job_id=${encodeURIComponent(jobId)}`
        : "/api/worker/consolidation/stream";
      const es = new EventSource(url);
      esRef.current = es;

      es.onmessage = (event) => {
        let data: SnapshotEvent;
        try {
          data = JSON.parse(event.data);
        } catch {
          return; // ignore malformed / non-JSON frames
        }

        // The POST never created a job — surface it, don't spin forever.
        if (data.status === "not_started") {
          setState({
            phase: "not_started",
            visible: true,
            error: "Consolidation never started. Try again.",
          });
          close();
          return;
        }

        if (data.status === "failed") {
          setState((s) => ({
            ...s,
            phase: "failed",
            visible: true,
            error: data.error ?? "Consolidation failed",
          }));
          close();
          return;
        }

        // Final event carries mcp_url and the finished counters.
        if (data.type === "complete" || data.status === "done") {
          setState((s) => ({
            ...s,
            phase: "done",
            visible: true,
            docsProcessed: data.docs_processed ?? s.docsProcessed,
            vectorsIndexed: data.vectors_indexed ?? s.vectorsIndexed,
            docsSkipped: data.docs_skipped ?? s.docsSkipped,
            leafTopics: data.leaf_topics ?? s.leafTopics,
            totalTopics: data.total_topics ?? s.totalTopics,
            mcpUrl: data.mcp_url ?? s.mcpUrl,
          }));
          close();
          return;
        }

        // running / clustering — counters update as batches flush.
        setState((s) => ({
          ...s,
          visible: true,
          phase: data.status === "clustering" ? "clustering" : "running",
          docsProcessed: data.docs_processed ?? s.docsProcessed,
          docsSkipped: data.docs_skipped ?? s.docsSkipped,
          docsOrphaned: data.docs_orphaned ?? s.docsOrphaned,
          vectorsIndexed: data.vectors_indexed ?? s.vectorsIndexed,
        }));
      };

      es.onerror = () => {
        // Connection dropped; the job keeps running server-side. Leave the last
        // state on screen (don't flip to error) and stop retrying.
        close();
      };
    },
    [close],
  );

  useEffect(() => close, [close]);

  return { ...state, watch, dismiss };
}
