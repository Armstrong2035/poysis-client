import { createClient } from "@/utils/supabase/client";
import { normalizeJob, type ConsolidationJob } from "@/lib/consolidationJob";

/**
 * Reads consolidation state straight from Supabase in the browser.
 *
 * The worker owns `consolidation_jobs`; it is a plain table the signed-in
 * owner can select. Reading it directly is what lets the status bars work
 * without an EventSource — a browser EventSource can't set the `X-User-ID`
 * header the worker's stream wants, which is why the old SSE path had to be
 * proxied and still dropped silently on every reconnect.
 *
 * Every query returns `{ ok, job }` rather than throwing: `ok: false` means the
 * read itself failed (most likely a missing RLS select policy), which callers
 * treat differently from "no job yet" — they fall back to the status route,
 * which reads the same rows with the request's cookie session.
 */

/** The newest job row for a workspace — what the live bar follows. */
export async function fetchLatestJob(workspaceId: string) {
  const supabase = createClient();
  // select("*") rather than named columns: the counter shape varies by worker
  // version, and asking PostgREST for a column that doesn't exist errors the
  // whole query instead of returning what is there.
  const { data, error } = await supabase
    .from("consolidation_jobs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false as const, job: null };
  return { ok: true as const, job: normalizeJob(data) };
}

/** The last run that finished cleanly — the stable bar's totals come from here. */
export async function fetchLastCompletedJob(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("consolidation_jobs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "done")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false as const, job: null };
  return { ok: true as const, job: normalizeJob(data) };
}

/**
 * Push updates for a workspace's jobs. Returns an unsubscribe function.
 *
 * Realtime is an accelerator, never the only signal: if the table isn't in the
 * `supabase_realtime` publication this subscribes successfully and simply never
 * fires, and the caller's poll keeps the bar current regardless.
 */
export function subscribeToJobs(
  workspaceId: string,
  onJob: (job: ConsolidationJob) => void,
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`consolidation-jobs-${workspaceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "consolidation_jobs",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        const job = normalizeJob(payload.new);
        if (job) onJob(job);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
