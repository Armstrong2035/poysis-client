import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getAuthUser } from "@/lib/getAuthUser";
import type { Ceiling } from "@/lib/ceiling";

const VALID_CEILINGS: Ceiling[] = ["private", "team", "public"];

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getAuthUser(req, supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("cluster_ceilings")
    .select("topic_id, ceiling")
    .eq("owner_user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ceilings: data ?? [] });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getAuthUser(req, supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { topicId, ceiling } = body as { topicId?: string; ceiling?: string };

  if (!topicId) return NextResponse.json({ error: "topicId is required" }, { status: 400 });
  if (ceiling === "team") {
    return NextResponse.json({ error: "Team ceiling isn't available yet" }, { status: 400 });
  }
  if (!VALID_CEILINGS.includes(ceiling as Ceiling)) {
    return NextResponse.json({ error: "Invalid ceiling" }, { status: 400 });
  }

  const { error } = await supabase.from("cluster_ceilings").upsert(
    {
      topic_id: topicId,
      owner_user_id: user.id,
      ceiling,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "topic_id,owner_user_id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
