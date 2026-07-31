import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "../../../../../../utils/supabase/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { getWorkspaceId } from "@/lib/workspace";
import { normalizeJob } from "@/lib/consolidationJob";

// Server-side mirror of the browser's Supabase reads. The status bars query
// consolidation_jobs directly from the client; this route serves two jobs:
//
//   1. It hands the browser its workspace_id, which every direct query needs.
//   2. It is the fallback when the direct read comes back empty or errors —
//      typically a missing RLS select policy on consolidation_jobs. This runs
//      with the request's cookie session, so the bars keep working either way.
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getAuthUser(req, supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId) {
    return NextResponse.json({
      workspaceId: null,
      job: null,
      lastCompletedJob: null,
      indexedFiles: 0,
      youtubeChannels: 0,
      activeYoutubeChannels: 0,
    });
  }

  const [latestResult, completedResult, indexedResult, channelsResult] = await Promise.all([
    supabase
      .from("consolidation_jobs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("consolidation_jobs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("status", "done")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("consolidation_indexed_files")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    supabase.from("youtube_channels").select("enabled").eq("workspace_id", workspaceId),
  ]);

  if (latestResult.error) {
    console.error("[consolidation/status] failed to read job:", latestResult.error.message);
    return NextResponse.json({ error: "Couldn't load consolidation status" }, { status: 500 });
  }
  // A settled-totals miss is not fatal — the live bar and the topic-derived
  // counts still render, so log it and return what we have.
  if (completedResult.error) {
    console.error(
      "[consolidation/status] failed to read last completed job:",
      completedResult.error.message,
    );
  }

  const channels = (channelsResult.data ?? []) as { enabled?: boolean }[];

  return NextResponse.json({
    workspaceId,
    job: normalizeJob(latestResult.data),
    lastCompletedJob: normalizeJob(completedResult.data),
    indexedFiles: indexedResult.count ?? 0,
    youtubeChannels: channels.length,
    activeYoutubeChannels: channels.filter((channel) => channel.enabled !== false).length,
  });
}
