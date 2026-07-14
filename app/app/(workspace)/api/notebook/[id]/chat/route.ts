import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../utils/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { cookies } from "next/headers";

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "";
if (!WORKER_URL) throw new Error("WORKER_URL environment variable is not set");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playgroundId } = await params;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the playground (notebook) exists. Notebook-level access itself
    // is a "capability URL" model (holding a working link is sufficient) —
    // we don't gate who can open a notebook. What we DO gate below is which
    // clusters a non-owner requester can actually retrieve from, via each
    // topic's ceiling — that's the real, enforced backstop regardless of who
    // has the link.
    const { data: notebook, error: notebookError } = await supabase
      .from("notebooks")
      .select("id, user_id, config")
      .eq("id", playgroundId)
      .single();

    if (notebookError || !notebook) {
      return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      query,
      top_k = 5,
      min_score = 0.4,
      model,
      instructions,
      allowed_topic_ids,
      allowed_connection_ids,
    } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const isOwner = user.id === notebook.user_id;
    let effectiveTopicIds: string[] | undefined = allowed_topic_ids;
    let effectiveConnectionIds: string[] | undefined = allowed_connection_ids;

    if (!isOwner) {
      // Never trust a non-owner's requested scope as-is — recompute it from
      // what this notebook's owner has actually marked public. A cluster's
      // ceiling is the only thing standing between "someone has this link"
      // and "someone can read this owner's private documents."
      let publicTopicsQuery = supabase
        .from("cluster_ceilings")
        .select("topic_id")
        .eq("owner_user_id", notebook.user_id)
        .eq("ceiling", "public");
      if (allowed_topic_ids?.length > 0) {
        publicTopicsQuery = publicTopicsQuery.in("topic_id", allowed_topic_ids);
      }
      const { data: publicTopics } = await publicTopicsQuery;
      effectiveTopicIds = (publicTopics ?? []).map((row) => row.topic_id);

      // No ceiling concept exists for connections yet, so there's nothing to
      // validate a non-owner's requested connection scope against — the only
      // safe default is none at all, not "trust the client."
      effectiveConnectionIds = undefined;

      if (effectiveTopicIds.length === 0) {
        return new Response(
          "No public information is available for this notebook yet.",
          { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      }
    }

    // The worker's /chat contract is scoped by workspace_id, not notebook_id —
    // always resolve it from the URL-verified notebook owner, never from a
    // client-supplied value, for the same reason notebook_id used to be pinned.
    const workspaceId = await getWorkspaceId(supabase, notebook.user_id);
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const workerUrl = `${WORKER_URL.replace(/\/$/, "")}/chat`;

    console.log(
      `[notebook/chat] → ${workerUrl} | playground: ${playgroundId} | workspace: ${workspaceId} | user: ${user.id} | owner: ${isOwner} | query: "${query?.slice(0, 60)}"`
    );

    const workerRes = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": notebook.user_id,
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        query,
        top_k,
        min_score,
        ...(model ? { model } : {}),
        ...(instructions ? { instructions } : {}),
        ...(effectiveTopicIds?.length ? { allowed_topic_ids: effectiveTopicIds } : {}),
        ...(effectiveConnectionIds?.length ? { allowed_connection_ids: effectiveConnectionIds } : {}),
      }),
    });

    if (!workerRes.ok) {
      const text = await workerRes.text();
      console.error(`[notebook/chat] ← ${workerRes.status} | ${text.slice(0, 200)}`);
      return new Response(text, { status: workerRes.status });
    }

    return new Response(workerRes.body, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("[notebook/chat] Proxy error:", err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "Proxy failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
