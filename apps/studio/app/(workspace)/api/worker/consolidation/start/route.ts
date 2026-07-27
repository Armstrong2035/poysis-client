import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../utils/supabase/server";
import { cookies } from "next/headers";
import { getWorkspaceId } from "@/lib/workspace";
import { getAuthUser } from "@/lib/getAuthUser";
import { resolveWorkspaceSources } from "@/lib/workspaceSources";

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "";
if (!WORKER_URL) throw new Error("WORKER_URL environment variable is not set");

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getAuthUser(req, supabase);

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId)
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  const userId = user.id;

  // The worker now requires a non-empty `sources` and ingests only what's
  // listed, so send the workspace's actual connections instead of a hardcoded
  // default (which excluded YouTube and 401'd YouTube-only workspaces).
  const connected = await resolveWorkspaceSources(supabase, workspaceId, userId);
  if (connected.length === 0) {
    return NextResponse.json(
      {
        error:
          "No sources connected. Connect Google Drive or a YouTube channel first.",
      },
      { status: 400 },
    );
  }

  // A per-source "Sync" passes the specific type(s) to reindex; honor only the
  // ones actually connected. No override → snapshot everything ("Build Map").
  const body = await req.json().catch(() => ({}));
  const requested: string[] = Array.isArray(body?.sources)
    ? body.sources.filter((s: unknown): s is string => typeof s === "string")
    : [];
  const sources =
    requested.length > 0
      ? connected.filter((s) => requested.includes(s))
      : connected;
  if (sources.length === 0) {
    return NextResponse.json(
      { error: "That source isn't connected." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${WORKER_URL}/consolidation/snapshot`, {
      method: "POST",
      headers: {
        "X-User-ID": userId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        sources,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[consolidation/start] Worker error:", text);
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[consolidation/start] Fetch error:", err);
    const message = err instanceof Error ? err.message : "Failed to reach worker";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
