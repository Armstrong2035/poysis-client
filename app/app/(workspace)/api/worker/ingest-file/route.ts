import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../utils/supabase/server";
import { cookies } from "next/headers";

const WORKER_URL = process.env.WORKER_URL ?? process.env.LOCAL_WORKER_URL ?? "";
if (!WORKER_URL) throw new Error("WORKER_URL environment variable is not set");

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  const url = `${WORKER_URL.replace(/\/$/, "")}/retrieval/ingest-file`;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.arrayBuffer();
    console.log(`[ingest-file] â†’ ${url} | ${body.byteLength} bytes | ${contentType.slice(0, 60)} | user: ${user.id}`);

    const workerRes = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": contentType,
        "X-User-ID": user.id,
      },
      body: Buffer.from(body),
    });

    const text = await workerRes.text();
    console.log(`[ingest-file] â† ${workerRes.status} | ${text.slice(0, 200)}`);

    try {
      return NextResponse.json(JSON.parse(text), { status: workerRes.status });
    } catch {
      return NextResponse.json({ error: text }, { status: workerRes.status });
    }
  } catch (err: any) {
    console.error("[ingest-file] Proxy error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Proxy failed" },
      { status: 500 }
    );
  }
}
