import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = ReturnType<typeof createClient>;

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "";

/**
 * The source types a workspace actually has connected, in the vocabulary the
 * worker's consolidation endpoints expect ("google_drive" | "youtube").
 *
 * `POST /consolidation/snapshot` now *requires* a non-empty `sources` array and
 * ingests only what's listed — so callers must send the workspace's real
 * connections rather than a hardcoded default. Listing a platform that isn't
 * connected makes the worker reject the run (e.g. "youtube" with no channels →
 * 400, "google_drive" with no OAuth → 401), which is exactly what this avoids.
 */
export async function resolveWorkspaceSources(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
): Promise<string[]> {
  const sources: string[] = [];

  // Drive connections live in Supabase — a single row is enough to include it.
  const { data: driveRows } = await supabase
    .from("drive_connections")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .limit(1);
  if ((driveRows?.length ?? 0) > 0) sources.push("google_drive");

  // YouTube channels are worker-owned; ask the worker whether any are attached.
  if (WORKER_URL) {
    try {
      const res = await fetch(
        `${WORKER_URL.replace(/\/$/, "")}/sources/youtube/channels?workspace_id=${encodeURIComponent(workspaceId)}`,
        { headers: { "X-User-ID": userId } },
      );
      if (res.ok) {
        const data = await res.json();
        if ((data.channels?.length ?? 0) > 0) sources.push("youtube");
      }
    } catch {
      // Worker unreachable — return what we could confirm rather than throwing.
    }
  }

  return sources;
}
