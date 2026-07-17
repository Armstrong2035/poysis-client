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

  // Fetch the connection to get its email (worker needs the email, not the UUID)
  const { data: connection, error: fetchError } = await supabase
    .from("drive_connections")
    .select("google_account_email")
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  // Remove from Supabase
  const { error: deleteError } = await supabase
    .from("drive_connections")
    .delete()
    .eq("id", connectionId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Get session JWT for worker auth
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? "";

  // Notify worker â€” form-encoded body + Bearer token
  try {
    await fetch(`${WORKER_URL}/sources/gdrive/disconnect`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-User-ID": user.id,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        workspace_id: (await getWorkspaceId(supabase, user.id)) ?? user.id,
        google_account_email: connection.google_account_email,
      }).toString(),
    });
  } catch {
    // Non-fatal â€” connection already removed from Supabase
  }

  return NextResponse.json({ ok: true });
}
