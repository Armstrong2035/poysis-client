import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../utils/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { cookies } from "next/headers";

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "";
if (!WORKER_URL) throw new Error("WORKER_URL environment variable is not set");

/**
 * Document / passage / category totals for one notebook's slice of the
 * knowledge base.
 *
 * The consolidation endpoints all count the whole workspace, which is why a
 * notebook scoped to a single YouTube channel used to report the same figures
 * as every other notebook. This forwards the notebook's own scope
 * (allowed_connection_ids / allowed_topic_ids) so the numbers describe exactly
 * what that notebook answers from.
 */
export async function POST(req: NextRequest) {
  const url = `${WORKER_URL.replace(/\/$/, "")}/retrieval/counts`;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notebook_id, allowed_topic_ids, allowed_connection_ids } = body;

    // Resolve the workspace from the NOTEBOOK ROW, exactly like /api/worker/chat
    // does. These two must agree: this endpoint reports what the notebook holds
    // and that one answers from it, so resolving differently would let the pane
    // describe a different workspace than the answers come from — which is the
    // failure mode documented at length in the chat route.
    let workspaceId: string | null = null;
    if (notebook_id) {
      const { data: notebook } = await supabase
        .from("notebooks")
        .select("workspace_id, user_id")
        .eq("id", notebook_id)
        .maybeSingle();
      if (notebook?.user_id === user.id) workspaceId = notebook.workspace_id;
    }
    workspaceId ??= await getWorkspaceId(supabase, user.id);

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const workerRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": user.id,
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        // Omitted rather than sent empty: the worker treats an empty list as a
        // real allowlist meaning "nothing permitted", which would count zero.
        ...(allowed_topic_ids?.length > 0 ? { allowed_topic_ids } : {}),
        ...(allowed_connection_ids?.length > 0 ? { allowed_connection_ids } : {}),
      }),
    });

    if (!workerRes.ok) {
      const text = await workerRes.text();
      console.error(`[worker/counts] ← ${workerRes.status} | ${text.slice(0, 200)}`);
      return NextResponse.json({ error: text }, { status: workerRes.status });
    }

    return NextResponse.json(await workerRes.json());
  } catch (err) {
    console.error("[worker/counts] Proxy error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Proxy failed" },
      { status: 500 },
    );
  }
}
