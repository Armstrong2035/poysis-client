import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { resolveConnectionSourceTypes } from "@/lib/connectionScope";
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

    // Marketplace notebooks are meant to be tried anonymously — only a
    // non-public notebook actually requires a logged-in caller (matching the
    // ceiling check the [slug] page already does before it ever renders the
    // chat UI).
    const notebookCeilingForAuth = notebook.config?.canvas?.ceiling ?? "private";
    if (!user && notebookCeilingForAuth !== "public") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const isOwner = user?.id === notebook.user_id;
    const notebookCeiling = notebookCeilingForAuth;
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

      // Connections have no per-connection ceiling. Instead, a public
      // NOTEBOOK's own connection scope is authoritative for non-owners:
      // publishing it public is the owner's explicit decision to expose those
      // connections. Derive it from the STORED config — never the request
      // body — so a non-owner can't swap in a connection the notebook isn't
      // actually scoped to. A non-public notebook exposes no connections.
      if (notebookCeiling === "public") {
        const storedSources: string[] = (notebook.config?.activeBlocks ?? [])
          .flatMap((b: any) => b.sources ?? []);
        effectiveConnectionIds = storedSources
          .filter((s: string) => s.startsWith("conn:"))
          .map((s: string) => s.slice(5));
      } else {
        effectiveConnectionIds = undefined;
      }

      // Nothing the owner has exposed to non-owners → stop before any worker
      // call.
      if (!effectiveTopicIds.length && !effectiveConnectionIds?.length) {
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

    // The client scopes by connection row id (conn:<id>), but the worker's
    // allowed_connection_ids is a source_type allowlist — translate before
    // sending, or the filter matches nothing. See lib/connectionScope.ts.
    const connectionSourceTypes = effectiveConnectionIds?.length
      ? await resolveConnectionSourceTypes(
          supabase,
          workspaceId,
          notebook.user_id,
          effectiveConnectionIds,
        )
      : [];

    // Fail closed: a non-owner must never reach an unfiltered workspace query.
    // If neither a public-topic filter nor a resolved connection source_type
    // survived (e.g. a Drive connection a non-owner can't read through RLS),
    // return the empty-scope message rather than leaking the whole workspace.
    if (!isOwner && !effectiveTopicIds?.length && !connectionSourceTypes.length) {
      return new Response(
        "No public information is available for this notebook yet.",
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    const workerUrl = `${WORKER_URL.replace(/\/$/, "")}/chat`;

    console.log(
      `[notebook/chat] → ${workerUrl} | playground: ${playgroundId} | workspace: ${workspaceId} | user: ${user?.id ?? "anonymous"} | owner: ${isOwner} | query: "${query?.slice(0, 60)}"`
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
        ...(connectionSourceTypes.length ? { allowed_connection_ids: connectionSourceTypes } : {}),
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
