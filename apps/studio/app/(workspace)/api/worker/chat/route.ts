import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../utils/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { resolveConnectionSourceTypes } from "@/lib/connectionScope";
import { loadOuroboros } from "@/lib/ouroboros";
import { cookies } from "next/headers";

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "";
if (!WORKER_URL) throw new Error("WORKER_URL environment variable is not set");

export async function POST(req: NextRequest) {
  const url = `${WORKER_URL.replace(/\/$/, "")}/chat`;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId(supabase, user.id);
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const { query, top_k = 5, min_score = 0.4, model, allowed_topic_ids, allowed_connection_ids, useOuroboros } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const instructions = useOuroboros ? loadOuroboros() : undefined;

    // conn:<row-id> scope tags carry connection row ids, but the worker's
    // allowed_connection_ids is a source_type allowlist — translate them or
    // the filter matches nothing. See lib/connectionScope.ts.
    const connectionSourceTypes = allowed_connection_ids?.length
      ? await resolveConnectionSourceTypes(
          supabase,
          workspaceId,
          user.id,
          allowed_connection_ids,
        )
      : [];

    console.log(
      `[worker/chat] → ${url} | workspace: ${workspaceId} | user: ${user.id} | model: ${model ?? "default"} | query: "${query?.slice(0, 60)}"`,
    );

    const workerRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": user.id,
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        query,
        top_k,
        min_score,
        ...(model ? { model } : {}),
        ...(instructions ? { instructions } : {}),
        ...(allowed_topic_ids?.length > 0 ? { allowed_topic_ids } : {}),
        ...(connectionSourceTypes.length > 0 ? { allowed_connection_ids: connectionSourceTypes } : {}),
      }),
    });

    if (!workerRes.ok) {
      const text = await workerRes.text();
      console.error(
        `[worker/chat] ← ${workerRes.status} | ${text.slice(0, 200)}`,
      );
      return new Response(text, { status: workerRes.status });
    }

    return new Response(workerRes.body, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("[worker/chat] Proxy error:", err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "Proxy failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
