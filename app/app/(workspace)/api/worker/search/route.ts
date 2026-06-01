import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../utils/supabase/server";
import { cookies } from "next/headers";

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  const url = `${WORKER_URL.replace(/\/$/, "")}/retrieval/search`;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log(`[search] → ${url} | query: "${body.query?.slice(0, 60)}" | user: ${user.id}`);

    const workerRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": user.id,
      },
      body: JSON.stringify(body),
    });

    const text = await workerRes.text();
    console.log(`[search] ← ${workerRes.status} | ${text.slice(0, 200)}`);

    try {
      return NextResponse.json(JSON.parse(text), { status: workerRes.status });
    } catch {
      return NextResponse.json({ error: text }, { status: workerRes.status });
    }
  } catch (err: any) {
    console.error("[search] Proxy error:", err);
    return NextResponse.json({ error: err?.message ?? "Proxy failed" }, { status: 500 });
  }
}
