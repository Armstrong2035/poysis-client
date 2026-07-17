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

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId)
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  // Fetch locked topic IDs so the worker can preserve user-modified topics.
  const { data: overrides } = await supabase
    .from("topic_overrides")
    .select("topic_id")
    .eq("workspace_id", workspaceId)
    .eq("locked", true);

  const lockedTopicIds = (overrides ?? []).map((r: { topic_id: string }) => r.topic_id);

  try {
    const res = await fetch(`${WORKER_URL}/consolidation/cluster/${workspaceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-ID": user.id },
      body: JSON.stringify({ locked_topic_ids: lockedTopicIds }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
