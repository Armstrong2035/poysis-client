/**
 * Shape of a `consolidation_jobs` row and how to read one.
 *
 * Deliberately dependency-free: both the browser (which queries the table
 * directly) and the status route (which queries it with the cookie session)
 * normalize rows through here, so the two paths can never disagree about what
 * a job means.
 */

type Row = Record<string, unknown>;

export type ConsolidationPhase =
  | "idle"
  | "running"
  | "clustering"
  | "done"
  | "failed"
  | "not_started";

/** A job row, normalized to the shape the UI renders. */
export type ConsolidationJob = {
  id?: string;
  status?: string;
  phase: "running" | "clustering" | "done" | "failed";
  docsProcessed?: number;
  docsSkipped?: number;
  docsOrphaned?: number;
  vectorsIndexed?: number;
  leafTopics?: number;
  totalTopics?: number;
  error?: string;
  createdAt?: string;
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string;
};

/** A running job whose counters haven't moved in this long is probably stuck. */
export const STALL_AFTER_MS = 3 * 60_000;

const asRecord = (value: unknown): Row =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Row) : {};

/**
 * The worker has reported counters both as top-level columns and nested under
 * a `result` jsonb across versions, so read either — a bar that silently shows
 * zeroes because the shape moved is worse than one extra lookup.
 */
function num(row: Row, result: Row, keys: string[]) {
  for (const key of keys) {
    for (const source of [result, row]) {
      const value = source[key];
      if (typeof value === "number" && Number.isFinite(value)) return value;
    }
  }
  return undefined;
}

function str(row: Row, result: Row, keys: string[]) {
  for (const key of keys) {
    for (const source of [result, row]) {
      const value = source[key];
      if (typeof value === "string" && value) return value;
    }
  }
  return undefined;
}

export function phaseFromStatus(status?: string): ConsolidationJob["phase"] {
  switch (status?.toLowerCase()) {
    case "done":
    case "complete":
    case "completed":
    case "success":
    case "succeeded":
      return "done";
    case "failed":
    case "error":
    case "cancelled":
    case "canceled":
      return "failed";
    case "clustering":
      return "clustering";
    default:
      return "running";
  }
}

export function normalizeJob(row: unknown): ConsolidationJob | null {
  if (!row || typeof row !== "object") return null;
  const job = row as Row;
  const result = asRecord(job.result);
  const status = str(job, result, ["status", "state"]);

  return {
    id: str(job, {}, ["id", "job_id"]),
    status,
    phase: phaseFromStatus(status),
    docsProcessed: num(job, result, ["docs_processed", "files_processed", "processed_count"]),
    docsSkipped: num(job, result, ["docs_skipped", "files_skipped", "skipped_count"]),
    docsOrphaned: num(job, result, ["docs_orphaned", "orphaned_count"]),
    vectorsIndexed: num(job, result, ["vectors_indexed", "chunks_indexed", "passages_indexed"]),
    leafTopics: num(job, result, ["leaf_topics"]),
    totalTopics: num(job, result, ["total_topics", "topics_created"]),
    error: str(job, result, ["error", "error_message", "failure_reason"]),
    createdAt: str(job, {}, ["created_at"]),
    startedAt: str(job, {}, ["started_at", "created_at"]),
    updatedAt: str(job, {}, ["updated_at"]),
    completedAt: str(job, {}, ["completed_at", "finished_at"]),
  };
}

export function isActive(job: ConsolidationJob | null | undefined) {
  return job?.phase === "running" || job?.phase === "clustering";
}

/**
 * True when a job still claims to be running but hasn't written anything for a
 * while. The pane says "taking longer than usual" rather than freezing on a
 * counter that will never move again.
 */
export function isStalled(job: ConsolidationJob | null | undefined, now = Date.now()) {
  if (!isActive(job)) return false;
  const beat = Date.parse(job?.updatedAt ?? job?.startedAt ?? "");
  return Number.isFinite(beat) && now - beat > STALL_AFTER_MS;
}
