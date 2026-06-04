import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../utils/supabase/server";
import { cookies } from "next/headers";
import { getWorkspaceId } from "@/lib/workspace";

const WORKER_URL =
  process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? process.env.NEXT_PUBLIC_WORKER_URL ?? "";

export async function GET(req: NextRequest) {
  if (!WORKER_URL) {
    return NextResponse.json({ error: "WORKER_URL not configured" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId) {
    return NextResponse.redirect(new URL("/workspace?drive=error&reason=no_workspace", req.url));
  }

  const params = new URLSearchParams({ workspace_id: workspaceId, user_id: user.id });
  return NextResponse.redirect(`${WORKER_URL}/auth/google?${params}`);
}
