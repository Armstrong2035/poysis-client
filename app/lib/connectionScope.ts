import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = ReturnType<typeof createClient>;

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "";

/**
 * A notebook's chat scope stores each connected source as a `conn:<row-id>`
 * tag, where <row-id> is a drive_connections.id or youtube_channels.id
 * primary key (see ConnectionScopePicker — the tag doesn't encode which
 * table the id belongs to).
 *
 * The worker's /chat endpoint, however, does NOT filter by row id. Its
 * `allowed_connection_ids` param is really a `source_type` allowlist — it
 * matches the vector metadata field `source_type`, a connector-TYPE string
 * ("youtube" / "google_drive"), against the passed values. Handing it raw
 * row ids matches zero vectors, so a notebook scoped to a connection answers
 * every question with the worker's empty-result fallback.
 *
 * This resolves each row id to its connector's source_type so the filter
 * actually hits.
 *
 * CAVEAT: this collapses "scope to THIS connection" down to "scope to ALL
 * <type> content in the workspace." Correct while a workspace has one
 * connection per type (the common case), but it CANNOT distinguish two
 * YouTube channels — both carry source_type "youtube". True per-channel
 * scoping needs a channel_id written into vector metadata worker-side; until
 * that lands, don't expose multi-channel-per-workspace scoping in the UI or
 * this will silently pull from every channel.
 */
export async function resolveConnectionSourceTypes(
  supabase: SupabaseClient,
  workspaceId: string,
  ownerUserId: string,
  connectionRowIds: string[],
): Promise<string[]> {
  if (connectionRowIds.length === 0) return [];

  const sourceTypes = new Set<string>();

  // Drive connections live in Supabase and are directly queryable.
  const { data: driveRows } = await supabase
    .from("drive_connections")
    .select("id")
    .eq("workspace_id", workspaceId)
    .in("id", connectionRowIds);
  const driveIds = new Set((driveRows ?? []).map((r: { id: string }) => r.id));
  if (driveIds.size > 0) sourceTypes.add("google_drive");

  // Anything that wasn't a Drive row may be a worker-owned YouTube channel —
  // only pay for that lookup if some ids are still unaccounted for.
  const unresolved = connectionRowIds.filter((id) => !driveIds.has(id));
  if (unresolved.length > 0 && WORKER_URL) {
    try {
      const res = await fetch(
        `${WORKER_URL.replace(/\/$/, "")}/sources/youtube/channels?workspace_id=${encodeURIComponent(workspaceId)}`,
        { headers: { "X-User-ID": ownerUserId } },
      );
      if (res.ok) {
        const data = await res.json();
        const ytIds = new Set(
          (data.channels ?? []).map((c: { id: string }) => c.id),
        );
        if (unresolved.some((id) => ytIds.has(id))) sourceTypes.add("youtube");
      }
    } catch {
      // Worker unreachable — we can't resolve YouTube scope this request.
      // Returning what we have (rather than throwing) keeps chat answering;
      // worst case the YouTube filter is dropped, not the whole reply.
    }
  }

  return [...sourceTypes];
}
