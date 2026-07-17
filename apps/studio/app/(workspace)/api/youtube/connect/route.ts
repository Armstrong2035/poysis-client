import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../utils/supabase/server";
import { cookies } from "next/headers";
import { getWorkspaceId } from "@/lib/workspace";
import { getAuthUser } from "@/lib/getAuthUser";

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "";
if (!WORKER_URL) throw new Error("WORKER_URL environment variable is not set");

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getAuthUser(req, supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { channelUrl, channelName } = body as { channelUrl?: string; channelName?: string };
  if (!channelUrl?.trim()) {
    return NextResponse.json({ error: "channelUrl is required" }, { status: 400 });
  }

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? "";

  // Worker resolves channel_url whether it's a full URL, an @handle, or a
  // raw channel ID, then owns writing the youtube_connections row (same
  // service-role pattern as the Drive OAuth callback) — this route is just
  // a proxy, not the source of truth.
  const params = new URLSearchParams({
    workspace_id: workspaceId,
    channel_url: channelUrl.trim(),
  });
  if (channelName?.trim()) params.set("channel_name", channelName.trim());

  try {
    const workerRes = await fetch(`${WORKER_URL}/sources/youtube/connect`, {
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
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to reach worker" }, { status: 500 });
  }
}
