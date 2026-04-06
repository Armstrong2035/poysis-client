import { NextRequest, NextResponse } from "next/server";

const WORKER_URL = process.env.WORKER_URL ?? "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  const url = `${WORKER_URL.replace(/\/$/, "")}/retrieval/search`;

  try {
    const body = await req.json();
    console.log(`[search] → ${url} | query: "${body.query?.slice(0, 60)}"`);

    const workerRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
