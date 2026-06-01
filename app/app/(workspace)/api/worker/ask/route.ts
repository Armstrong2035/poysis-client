import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../utils/supabase/server";
import { cookies } from "next/headers";

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  const url = `${WORKER_URL.replace(/\/$/, "")}/retrieval/ask`;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log(`[ask] → ${url} | query: "${body.query?.slice(0, 60)}" | user: ${user.id}`);

    const workerRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": user.id,
      },
      body: JSON.stringify(body),
    });

    if (!workerRes.ok) {
      const text = await workerRes.text();
      console.error(`[ask] ← ${workerRes.status} | ${text.slice(0, 200)}`);
      return new Response(text, { status: workerRes.status });
    }

    return new Response(workerRes.body, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("[ask] Proxy error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Proxy failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
