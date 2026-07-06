import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../utils/supabase/server";
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

    // Verify the playground (notebook) exists and this user has access.
    // For now we check the notebooks table directly; playground-specific ACLs
    // will be enforced here once the playground membership table is added.
    const { data: notebook, error: notebookError } = await supabase
      .from("notebooks")
      .select("id, user_id, config")
      .eq("id", playgroundId)
      .single();

    if (notebookError || !notebook) {
      return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
    }

    const body = await req.json();
    const { query, notebook_id, stream, instructions, allowed_topic_ids, allowed_connection_ids } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const workerUrl = `${WORKER_URL.replace(/\/$/, "")}/retrieval/ask`;

    console.log(
      `[notebook/chat] → ${workerUrl} | playground: ${playgroundId} | user: ${user.id} | query: "${query?.slice(0, 60)}"`
    );

    const workerRes = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": notebook.user_id,
      },
      body: JSON.stringify({
        notebook_id: notebook_id ?? playgroundId,
        query,
        stream: stream ?? true,
        ...(instructions ? { instructions } : {}),
        ...(allowed_topic_ids?.length > 0 ? { allowed_topic_ids } : {}),
        ...(allowed_connection_ids?.length > 0 ? { allowed_connection_ids } : {}),
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
