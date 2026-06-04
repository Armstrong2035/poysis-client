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

  const { connectionId } = await req.json();
  if (!connectionId) {
    return NextResponse.json({ error: "connectionId required" }, { status: 400 });
  }

  // Fetch full connection details
  const { data: connection, error: dbError } = await supabase
    .from("drive_connections")
    .select("access_token, refresh_token, token_expiry, google_account_email")
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .single();

  if (dbError || !connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  // Get session JWT
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? "";

  try {
    // Re-use the connect endpoint for a sync â€” worker handles re-indexing idempotently
    const workerRes = await fetch(`${WORKER_URL}/sources/gdrive/connect`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-User-ID": user.id,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        workspace_id: (await getWorkspaceId(supabase, user.id)) ?? user.id,
        google_account_email: connection.google_account_email,
        access_token: connection.access_token,
        refresh_token: connection.refresh_token ?? "",
        token_expiry: connection.token_expiry ?? "",
      }).toString(),
    });

    if (!workerRes.ok) {
      const text = await workerRes.text();
      console.error("[drive-resync] Worker error:", text);
      return NextResponse.json({ error: "Worker sync failed" }, { status: 502 });
    }

    const result = await workerRes.json();
    const docCount = result.doc_count ?? 0;

    // Update doc_count and last_synced_at
    await supabase
      .from("drive_connections")
      .update({ doc_count: docCount, last_synced_at: new Date().toISOString() })
      .eq("id", connectionId)
      .eq("user_id", user.id);

    return NextResponse.json({ ok: true, doc_count: docCount });
  } catch (err: any) {
    console.error("[drive-resync] Fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
