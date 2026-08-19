import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../utils/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
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

    const body = await req.json();
    const { query, notebook_id, top_k = 5, min_score = 0.4, model, allowed_topic_ids, allowed_connection_ids, useOuroboros, history, sources_first } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Resolve the workspace from the NOTEBOOK ROW, exactly like the marketplace
    // notebook route does — the two must agree or the same notebook answers
    // differently depending on which app you ask from.
    //
    // Resolving by user_id instead (getWorkspaceId) is what broke studio: it
    // returns the lowest-sorting of a user's workspace rows, and duplicates
    // exist on accounts created before the unique(user_id) constraint. When the
    // notebook's content was indexed under the other row, the worker searched an
    // empty workspace and every answer came back with nothing found — while the
    // marketplace, reading notebook.workspace_id, hit the right one.
    //
    // getWorkspaceId stays as the fallback for callers with no notebook context.
    let workspaceId: string | null = null;
    if (notebook_id) {
      const { data: notebook } = await supabase
        .from("notebooks")
        .select("workspace_id, user_id")
        .eq("id", notebook_id)
        .maybeSingle();
      // Only honour a notebook this caller owns — otherwise fall through to
      // their own workspace rather than querying someone else's.
      if (notebook?.user_id === user.id) workspaceId = notebook.workspace_id;
    }
    workspaceId ??= await getWorkspaceId(supabase, user.id);

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    const instructions = useOuroboros ? loadOuroboros() : undefined;

    // Pass connection row ids through untouched — the worker owns the mapping.
    // We used to translate them to source_type strings via
    // resolveConnectionSourceTypes, on the theory that allowed_connection_ids
    // was a source_type allowlist. It isn't: the marketplace notebook route
    // sends bare row ids and retrieval works there, while the same query under
    // studio's translated types returned nothing. Keep both routes on the same
    // contract.

    console.log(
      `[worker/chat] → ${url} | workspace: ${workspaceId} | notebook: ${notebook_id ?? "none"} | user: ${user.id} | model: ${model ?? "default"} | topics: ${allowed_topic_ids?.length ?? 0} | conns: ${allowed_connection_ids?.join(",") || "none"} | query: "${query?.slice(0, 60)}"`,
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
        // Without this the worker returns one buffered response and the client
        // renders the whole answer at once. The response body is piped straight
        // through below, so the flag is all that's needed to stream.
        stream: true,
        ...(model ? { model } : {}),
        ...(instructions ? { instructions } : {}),
        ...(allowed_topic_ids?.length > 0 ? { allowed_topic_ids } : {}),
        ...(allowed_connection_ids?.length > 0 ? { allowed_connection_ids } : {}),
        // Conversation memory and sources-first ordering are client-owned: the
        // worker stores no transcript, so anything this proxy drops is simply
        // lost. Both are inert unless the client asks for them.
        ...(history?.length > 0 ? { history } : {}),
        ...(sources_first ? { sources_first: true } : {}),
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
