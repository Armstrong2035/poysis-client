import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
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
      .select("id, user_id, config, workspace_id, name")
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
      history,
      sources_first,
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

    // The worker's /chat contract is scoped by workspace_id. It lives on the
    // notebook row itself, which is public-readable — so this resolves for
    // anonymous viewers too. (Previously we looked it up from the workspaces
    // table via user_id, which anon RLS blocks → null → a 404 on every public
    // notebook.) New notebooks must be created with workspace_id set.
    const workspaceId = notebook.workspace_id;
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // The worker's allowed_connection_ids takes the raw conn:<id> ids directly
    // — it owns the mapping to source types. (We used to translate them here
    // via resolveConnectionSourceTypes, but that came back empty and dropped
    // the filter, so every query returned nothing.)

    // Fail closed: a non-owner must never reach an unfiltered workspace query.
    // If neither a public-topic filter nor a connection scope survived (e.g. a
    // Drive connection a non-owner can't read through RLS), return the
    // empty-scope message rather than leaking the whole workspace.
    if (!isOwner && !effectiveTopicIds?.length && !effectiveConnectionIds?.length) {
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
        // Voice: let the worker frame answers as the interpreter of this creator's
        // work rather than a generic assistant. appLabel is the bot's display name;
        // fall back to the notebook name.
        ...((notebook.config?.theme?.appLabel ?? notebook.name)
          ? { creator_name: notebook.config?.theme?.appLabel ?? notebook.name }
          : {}),
        // Conversation memory and sources-first ordering are client-owned: the
        // worker stores no transcript, so anything this proxy drops is simply
        // lost. Both are inert unless the visitor's client asks for them.
        ...(history?.length > 0 ? { history } : {}),
        ...(sources_first ? { sources_first: true } : {}),
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
