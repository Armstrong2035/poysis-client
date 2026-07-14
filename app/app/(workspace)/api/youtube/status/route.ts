import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../utils/supabase/server";
import { cookies } from "next/headers";
import { getWorkspaceId } from "@/lib/workspace";
import { getAuthUser } from "@/lib/getAuthUser";

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "";
if (!WORKER_URL) throw new Error("WORKER_URL environment variable is not set");

// Proxies the worker's own channel list (sources.py) instead of a Supabase
// table — youtube_channels is worker-owned and RLS-gated by workspace
// ownership internally, so there's nothing for this route to query directly.
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getAuthUser(req, supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId) {
    return NextResponse.json({ connections: [] });
  }

  try {
    const res = await fetch(
      `${WORKER_URL}/sources/youtube/channels?workspace_id=${encodeURIComponent(workspaceId)}`,
      { headers: { "X-User-ID": user.id } },
    );
    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ connections: data.channels ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to reach worker" }, { status: 500 });
  }
}
