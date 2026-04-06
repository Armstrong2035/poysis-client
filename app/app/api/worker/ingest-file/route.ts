import { NextRequest, NextResponse } from "next/server";

const WORKER_URL = process.env.WORKER_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  const url = `${WORKER_URL.replace(/\/$/, "")}/retrieval/ingest-file`;

  try {
    const body = await req.arrayBuffer();
    console.log(`[ingest-file] → ${url} | ${body.byteLength} bytes | ${contentType.slice(0, 60)}`);

    const workerRes = await fetch(url, {
      method: "POST",
      headers: { "content-type": contentType },
      body: Buffer.from(body),
    });

    const text = await workerRes.text();
    console.log(`[ingest-file] ← ${workerRes.status} | ${text.slice(0, 200)}`);

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
