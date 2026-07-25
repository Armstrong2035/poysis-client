import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../utils/supabase/server";
import { cookies } from "next/headers";
import { getWorkspaceId } from "@/lib/workspace";
import { getAuthUser } from "@/lib/getAuthUser";

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "";
if (!WORKER_URL) throw new Error("WORKER_URL environment variable is not set");

// Lists the playlists across the workspace's connected YouTube channels
// (worker-owned, via the YouTube Data API — works even without transcripts).
// Each playlist can be imported as a locked topic category. Like the channel
// list, this is a thin proxy: the worker checks workspace ownership internally.
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getAuthUser(req, supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId) {
    return NextResponse.json({ playlists: [] });
  }

  try {
    const res = await fetch(
      `${WORKER_URL}/sources/youtube/playlists?workspace_id=${encodeURIComponent(workspaceId)}`,
      { headers: { "X-User-ID": user.id } },
    );
    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ playlists: data.playlists ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reach worker";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
