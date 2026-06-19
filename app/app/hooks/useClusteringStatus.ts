"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { authedFetch } from "@/utils/authedFetch";
import { normalizeMcpUrl } from "@/utils/normalizeMcpUrl";

const STORAGE_KEY = "poysis-clustering-status";

export type ClusteringState = {
  status: "idle" | "running" | "clustering" | "done" | "failed";
  docsProcessed?: number;
  vectorsIndexed?: number;
  docsSkipped?: number;
  iterations?: number;
  leafTopics?: number;
  totalTopics?: number;
  mcpUrl?: string;
  error?: string;
  completedAt?: number;
};

export function useClusteringStatus() {
  const [state, setState] = useState<ClusteringState>({ status: "idle" });
  const esRef = useRef<EventSource | null>(null);

  const persist = useCallback((next: ClusteringState) => {
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const closeStream = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  const openStream = useCallback(() => {
    closeStream();

    const es = new EventSource("/api/worker/consolidation/stream");
    esRef.current = es;

    es.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "complete") {
          persist({
            status: "done",
            mcpUrl: normalizeMcpUrl(data.mcp_url) ?? undefined,
            leafTopics: data.leaf_topics,
            totalTopics: data.total_topics,
            docsProcessed: data.docs_processed,
            vectorsIndexed: data.vectors_indexed,
            completedAt: Date.now(),
          });
          closeStream();
          return;
        }

        if (data.type === "progress") {
          if (data.status === "failed") {
            persist({ status: "failed", error: data.error ?? "Consolidation failed" });
            closeStream();
            return;
          }

          persist({
            status: data.status === "clustering" ? "clustering" : "running",
            docsProcessed: data.docs_processed,
            vectorsIndexed: data.vectors_indexed,
            docsSkipped: data.docs_skipped,
            iterations: data.iterations,
            leafTopics: data.leaf_topics,
            totalTopics: data.total_topics,
          });
        }
      } catch {
        // ignore malformed events
      }
    });

    es.addEventListener("error", () => {
      // Stream dropped — job is still running on the backend.
      // Just close; localStorage keeps status as "running" so the
      // next mount will reconnect automatically.
      closeStream();
    });
  }, [persist, closeStream]);

  // On mount: restore last-known state, then always connect to the
  // snapshot stream. The worker may have started, progressed, or finished
  // a consolidation that this client never triggered (e.g. run from
  // another tab or kicked off locally), so the stream's initial snapshot
  // is what reconciles local state with backend truth.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setState(JSON.parse(stored));
      } catch {
        // ignore malformed storage
      }
    }
    openStream();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => closeStream(), [closeStream]);

  const start = useCallback(async () => {
    persist({ status: "running" });

    try {
      const res = await authedFetch("/api/worker/consolidation/start", { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        persist({ status: "failed", error: text });
        return;
      }
      openStream();
    } catch (err: any) {
      persist({ status: "failed", error: err.message ?? "Failed to start consolidation" });
    }
  }, [persist, openStream]);

  const reset = useCallback(() => {
    closeStream();
    persist({ status: "idle" });
  }, [persist, closeStream]);

  return { ...state, start, reset };
}
