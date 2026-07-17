import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { getWorkspaceId } from "@/lib/workspace";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getAuthUser(req, supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId)
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("topic_overrides")
    .select("topic_id, locked")
    .eq("workspace_id", workspaceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ locks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getAuthUser(req, supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId)
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const body = await req.json();
  const { topicId, locked } = body as { topicId?: string; locked?: boolean };

  if (!topicId) return NextResponse.json({ error: "topicId is required" }, { status: 400 });
  if (typeof locked !== "boolean")
    return NextResponse.json({ error: "locked must be a boolean" }, { status: 400 });

  const { error } = await supabase.from("topic_overrides").upsert(
    {
      topic_id: topicId,
      workspace_id: workspaceId,
      user_id: user.id,
      locked,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "topic_id,workspace_id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
