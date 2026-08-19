
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConsolidationJob } from "@/lib/consolidationJob";
import { fetchLastCompletedJob } from "@/lib/consolidationStatus";
import type { Topic } from "@/app/(workspace)/workspace/ConsolidationContext";

/**
 * The settled summary of what's actually in a notebook — the stable bar.
 *
 * Where the live bar answers "are we building right now", this answers "what's
 * in here". Totals come from the last run that finished cleanly; the category
 * list comes from the consolidation topics the workspace already loads, so
 * there's a single fetch path for topics rather than two that can disagree.
 */

export type NotebookCategory = {
  topicId: string;
  label: string;
  docCount: number;
  summary?: string;
};

export type NotebookSummary = {
  /** A completed run exists, so these numbers describe a real notebook. */
  ready: boolean;
  /** Documents = videos. Null until we can count them. */
  documents: number | null;
  /** Chunks/passages — one per vector. */
  passages: number | null;
  categories: number | null;
  lastUpdated: string | null;
  /**
   * The categories actually present in this notebook's slice. These are the
   * leaf topics the clustering step stamps on each vector, not the roots the
   * cluster tree displays — a root id matches no vectors at all.
   */
  breakdown: NotebookCategory[];
  /**
   * These figures describe one notebook's own clusters rather than the whole
   * workspace. Consumers must not fall back to workspace-wide run counters
   * when a field is null here — for a scoped notebook those counters describe
   * a different, larger thing.
   */
  scoped: boolean;
};

/** Is there anything settled worth showing yet? */
export function hasSummaryContent(summary: NotebookSummary) {
  return summary.documents != null || summary.passages != null || summary.topLevel.length > 0;
}

const EMPTY: NotebookSummary = {
  ready: false,
  documents: null,
  passages: null,
  categories: null,
  lastUpdated: null,
  topLevel: [],
  scoped: false,
};

type StatusRouteResponse = { lastCompletedJob?: ConsolidationJob | null };

/** Shape of /api/worker/counts — the worker's scoped aggregate. */
type ScopedCounts = {
  documents: number;
  passages: number;
  categories: number;
  by_category: { category_id: string; documents: number }[];
};

export function useNotebookSummary({
  workspaceId,
  topics,
  clusterIds,
  connectionIds,
  notebookId,
  /** Bump when a run finishes so the settled totals re-read. */
  refreshKey,
}: {
  workspaceId: string | null;
  topics: Topic[] | null;
  /**
   * The clusters this notebook actually draws on (`topic:` sources). `topics`
   * is the whole workspace's cluster list, which is not what "in your
   * notebook" means — without this the pane shows every notebook the same
   * workspace-wide figures.
   */
  clusterIds: string[];
  /**
   * The whole connections this notebook pulls in (`conn:` sources). Topics carry
   * no connection id, so these can't be narrowed client-side — the worker counts
   * them by the connection_id stamped on each vector at ingest.
   */
  connectionIds: string[];
  /** Scopes the counts request, and resolves the workspace the way chat does. */
  notebookId: string | null;
  refreshKey?: string | number;
}): NotebookSummary {
  const [job, setJob] = useState<ConsolidationJob | null>(null);
  // Tagged with the scope it was fetched for, so a response that lands after the
  // notebook changed is ignored rather than shown against the wrong notebook.
  const [counts, setCounts] = useState<{ key: string; data: ScopedCounts } | null>(null);

  const refresh = useCallback(async () => {
    if (workspaceId) {
      const direct = await fetchLastCompletedJob(workspaceId);
      if (direct.ok) {
        setJob(direct.job);
        return;
      }
    }

    // Same RLS fallback as the live bar: the route reads the row server-side.
    try {
      const res = await fetch("/api/worker/consolidation/status", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as StatusRouteResponse;
      setJob(data.lastCompletedJob ?? null);
    } catch {
      // Topic-derived counts below still give a usable summary.
    }
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

  // clusterIds/connectionIds are rebuilt each render by their caller; key the
  // memo and the fetch on their contents so an unchanged source list is a no-op.
  const clusterKey = clusterIds.join(",");
  const connectionKey = connectionIds.join(",");
  const scopeKey = `${notebookId ?? ""}|${clusterKey}|${connectionKey}`;
  const hasScope = clusterIds.length > 0 || connectionIds.length > 0;

  useEffect(() => {
    if (!notebookId || !hasScope) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/worker/counts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            notebook_id: notebookId,
            allowed_topic_ids: clusterIds,
            allowed_connection_ids: connectionIds,
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as ScopedCounts;
        if (!cancelled) setCounts({ key: scopeKey, data });
      } catch {
        // Worker unreachable — the topic-derived fallback below still gives a
        // usable summary for cluster-scoped notebooks.
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey, hasScope, refreshKey]);

  // Only trust counts fetched for the scope on screen right now.
  const scopedCounts = counts?.key === scopeKey ? counts.data : null;

  return useMemo(() => {
    // A notebook is described by its own sources, never by the workspace. With
    // none attached there is nothing to describe.
    if (!hasScope) return EMPTY;

    // Topic ids arrive from the API as numbers while the source tags that carry
    // them ("topic:80") are strings, so every comparison goes through String().
    const topicById = new Map(
      (topics ?? []).map((topic) => [String(topic.topic_id), topic]),
    );

    // Preferred path: the worker counted this exact scope. `by_category` is
    // keyed by the category_id stamped on each vector — which is a LEAF topic
    // id, never the root the cluster tree shows. Labels are therefore looked up
    // across all topics, not just roots: filtering to roots here matched only
    // "Unsorted" and dropped every real category.
    if (scopedCounts) {
      const breakdown = scopedCounts.by_category
        .map((c) => {
          const topic = topicById.get(String(c.category_id));
          return {
            topicId: String(c.category_id),
            label: topic?.label ?? `Category ${c.category_id}`,
            docCount: c.documents,
            summary: topic?.semantic_summary,
          };
        })
        .sort((a, b) => b.docCount - a.docCount);

      return {
        ready: job != null,
        documents: scopedCounts.documents,
        passages: scopedCounts.passages,
        categories: scopedCounts.categories || null,
        lastUpdated: job?.completedAt ?? job?.updatedAt ?? null,
        breakdown,
        scoped: true,
      };
    }

    // Fallback while counts are in flight, or when the worker is unreachable.
    // Only cluster-scoped notebooks can be described without it — a
    // connection-scoped one has no client-side way to narrow the topic list, and
    // showing workspace figures there is the bug this endpoint exists to fix.
    if (clusterIds.length === 0) return EMPTY;

    const scopeSet = new Set(clusterIds.map(String));
    const breakdown = clusterIds
      .map((id) => topicById.get(String(id)))
      .filter((topic): topic is NonNullable<typeof topic> => topic != null)
      .filter((topic) => scopeSet.has(String(topic.topic_id)))
      .map((topic) => ({
        topicId: String(topic.topic_id),
        label: topic.label,
        docCount: topic.doc_count ?? 0,
        summary: topic.semantic_summary,
      }))
      .sort((a, b) => b.docCount - a.docCount);

    if (!breakdown.length) return EMPTY;

    return {
      ready: job != null,
      documents: breakdown.reduce((sum, topic) => sum + topic.docCount, 0),
      // Passages can't be attributed per cluster without the worker's count.
      passages: null,
      categories: breakdown.length,
      lastUpdated: job?.completedAt ?? job?.updatedAt ?? null,
      breakdown,
      scoped: true,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, topics, clusterKey, connectionKey, hasScope, scopedCounts]);
}
