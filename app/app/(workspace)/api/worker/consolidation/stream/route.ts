import { NextRequest } from "next/server";
import { createClient } from "../../../../../../utils/supabase/server";
import { cookies } from "next/headers";
import { getWorkspaceId } from "@/lib/workspace";
import { getAuthUser } from "@/lib/getAuthUser";

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const user = await getAuthUser(req, supabase);

  if (!user) return new Response("Unauthorized", { status: 401 });

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId) return new Response("Workspace not found", { status: 404 });
  const userId = user.id;

  const workerRes = await fetch(
    `${WORKER_URL}/consolidation/snapshot/stream/${workspaceId}`,
    {
      headers: {
        "X-User-ID": userId,
        "Accept": "text/event-stream",
        "Cache-Control": "no-cache",
      },
      signal: req.signal,
    }
  );

  if (!workerRes.ok || !workerRes.body) {
    return new Response("Stream unavailable", { status: 502 });
  }

  return new Response(workerRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
