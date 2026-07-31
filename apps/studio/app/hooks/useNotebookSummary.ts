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
  topLevel: NotebookCategory[];
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
};

type StatusRouteResponse = { lastCompletedJob?: ConsolidationJob | null };

export function useNotebookSummary({
  workspaceId,
  topics,
  /** Bump when a run finishes so the settled totals re-read. */
  refreshKey,
}: {
  workspaceId: string | null;
  topics: Topic[] | null;
  refreshKey?: string | number;
}): NotebookSummary {
  const [job, setJob] = useState<ConsolidationJob | null>(null);

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

  return useMemo(() => {
    // Sub-topics roll up into their parent, so summing the top level counts
    // each document once — and unlike the job row, it's available even when no
    // job has ever been readable.
    const topLevel = (topics ?? [])
      .filter((topic) => topic.parent_topic_id == null)
      .map((topic) => ({
        topicId: topic.topic_id,
        label: topic.label,
        docCount: topic.doc_count ?? 0,
        summary: topic.semantic_summary,
      }))
      .sort((a, b) => b.docCount - a.docCount);

    const documentsFromTopics = topLevel.length
      ? topLevel.reduce((sum, topic) => sum + topic.docCount, 0)
      : null;

    if (!job && !topLevel.length) return EMPTY;

    return {
      ready: job != null,
      documents: documentsFromTopics ?? job?.docsProcessed ?? null,
      passages: job?.vectorsIndexed ?? null,
      categories: topLevel.length || job?.totalTopics || null,
      lastUpdated: job?.completedAt ?? job?.updatedAt ?? null,
      topLevel,
    };
  }, [job, topics]);
}
