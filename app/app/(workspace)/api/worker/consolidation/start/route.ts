import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../utils/supabase/server";
import { cookies } from "next/headers";
import { getWorkspaceId } from "@/lib/workspace";
import { getAuthUser } from "@/lib/getAuthUser";

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

  try {
    const res = await fetch(`${WORKER_URL}/consolidation/snapshot`, {
      method: "POST",
      headers: {
        "X-User-ID": userId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        sources: ["google_drive"],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[consolidation/start] Worker error:", text);
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[consolidation/start] Fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
