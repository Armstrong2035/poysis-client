import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../utils/supabase/server";
import { cookies } from "next/headers";
import { getWorkspaceId } from "@/lib/workspace";
import { getAuthUser } from "@/lib/getAuthUser";

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "";
if (!WORKER_URL) throw new Error("WORKER_URL environment variable is not set");

// Imports selected playlists as locked topic categories. Idempotent on the
// worker side (re-importing reuses the same topic_id), so this route just
// forwards the picked ids. Mirrors the connect route's auth (Bearer + X-User-ID).
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getAuthUser(req, supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const playlistIds: string[] = Array.isArray(body.playlist_ids)
    ? body.playlist_ids.filter((id: unknown): id is string => typeof id === "string" && id.trim() !== "")
    : [];
  if (playlistIds.length === 0) {
    return NextResponse.json({ error: "playlist_ids is required" }, { status: 400 });
  }

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? "";

  const params = new URLSearchParams({
    workspace_id: workspaceId,
    playlist_ids: playlistIds.join(","),
  });

  try {
    const workerRes = await fetch(`${WORKER_URL}/sources/youtube/playlists/import`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-User-ID": user.id,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const text = await workerRes.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: workerRes.status });
    } catch {
      return NextResponse.json({ error: text }, { status: workerRes.status });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reach worker";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
