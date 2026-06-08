/**
 * The worker can hand back an MCP URL built on its internal localhost base
 * (e.g. http://localhost:8000/mcp/...). That must never surface in the UI —
 * users paste this into Claude, so it has to be publicly reachable.
 *
 * If the URL's host is local, swap its origin for the public worker origin
 * (NEXT_PUBLIC_WORKER_URL), preserving the path and query. Anything already
 * public, or anything we can't parse, passes through untouched.
 */
export function normalizeMcpUrl(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      const base = process.env.NEXT_PUBLIC_WORKER_URL;
      if (base) {
        const publicBase = new URL(base);
        url.protocol = publicBase.protocol;
        url.host = publicBase.host;
      }
    }
    return url.toString();
  } catch {
    // Not an absolute URL — leave it as-is rather than dropping it.
    return raw;
  }
}
