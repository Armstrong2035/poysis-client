/**
 * Parser for the worker's /chat stream.
 *
 * The stream carries machine blocks alongside the prose, in one of three shapes:
 *
 *   synthesis                <answer>\n\n__SOURCES__<json>\n\n__META__<json>
 *   synthesis+sources_first  __SOURCES__<json>\n\n<answer>\n\n__META__<json>
 *   retrieval                __MODE__<json>\n\n__SOURCES__<json>\n\n__META__<json>
 *
 * Retrieval mode is inferred by the worker unless the request pins `mode`, so a
 * plain query can come back retrieval-shaped without asking. Getting this wrong
 * renders raw markers as answer text, which is why it lives in its own module
 * with tests rather than inline in the component.
 *
 * Every function takes the FULL accumulated stream so far and is safe to call
 * on each chunk — markers routinely straddle chunk boundaries.
 */

/* Markers are matched bare rather than as "\n\n__SOURCES__": with sources_first
 * the block leads the stream and has no newlines in front of it. */
export const SOURCES_SENTINEL = "__SOURCES__";
export const META_SENTINEL = "__META__";
export const ERROR_SENTINEL = "__ERROR__";
export const MODE_SENTINEL = "__MODE__";

const BLOCK_SENTINELS = [SOURCES_SENTINEL, META_SENTINEL, ERROR_SENTINEL];

export type CitedSource = {
  file: string;
  score: number;
  snippet?: string;
  url?: string;
  title?: string;
};

export type ChatMeta = {
  scale?: { sources: number; excerpts: number };
  themes?: string[];
  /** Absent in retrieval mode — that path is LLM-free, so nothing quotes. */
  key_quote?: { text: string; title?: string; url?: string; start_time?: string } | null;
};

export type ChatMode = "retrieval" | "synthesis";

export type ParsedChat = {
  mode: ChatMode;
  /** "" in retrieval mode, and while only machine blocks have arrived. */
  answer: string;
  sources: CitedSource[];
  meta: ChatMeta | null;
  /** Set when the run failed mid-stream; the answer holds whatever arrived first. */
  error: string | null;
};

/**
 * Read one complete JSON value starting at `from`, and report where it ends.
 *
 * Slicing marker-to-marker stops working once sources can lead the stream: with
 * sources_first the prose sits BETWEEN __SOURCES__ and __META__, so slicing to
 * the next marker hands JSON.parse the answer text too and every source is
 * silently dropped. Counting brackets finds the true end instead. Returns null
 * while the value is still streaming in.
 */
export function readJsonAt(
  content: string,
  from: number,
): { value: unknown; end: number } | null {
  let start = from;
  while (start < content.length && /\s/.test(content[start])) start++;
  const open = content[start];
  if (open !== "[" && open !== "{") return null;
  const close = open === "[" ? "]" : "}";

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < content.length; i++) {
    const ch = content[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close && --depth === 0) {
      try {
        return { value: JSON.parse(content.slice(start, i + 1)), end: i + 1 };
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Index of the earliest machine block in `text`, or -1. */
function firstBlockAt(text: string): number {
  const hits = BLOCK_SENTINELS.map((s) => text.indexOf(s)).filter((i) => i >= 0);
  return hits.length ? Math.min(...hits) : -1;
}

/**
 * Mid-stream a marker can straddle a chunk boundary, leaving a fragment like
 * "__SOU" that indexOf won't match. Hide any trailing fragment so it doesn't
 * flash at the end of the answer before the rest arrives.
 */
function hideTrailingFragment(text: string): string {
  for (const marker of BLOCK_SENTINELS) {
    for (let n = Math.min(marker.length - 1, text.length); n > 0; n--) {
      if (text.endsWith(marker.slice(0, n))) return text.slice(0, -n);
    }
  }
  return text;
}

/** The sources block, wherever it appears. Empty until it has fully arrived. */
export function extractSources(content: string): CitedSource[] {
  return parseChat(content).sources;
}

/** One place that decides how to render a reply. */
export function parseChat(content: string): ParsedChat {
  const trimmed = content.trimStart();
  const retrieval = trimmed.startsWith(MODE_SENTINEL);
  // While the leading __MODE__ is still streaming in (e.g. "__MO"), suppress it
  // too so a partial marker never flashes as answer text before we know the mode.
  const partialMode =
    !retrieval && trimmed.length > 0 && MODE_SENTINEL.startsWith(trimmed);

  const sourcesAt = content.indexOf(SOURCES_SENTINEL);
  let sources: CitedSource[] = [];
  let sourcesEnd = -1;
  if (sourcesAt !== -1) {
    const read = readJsonAt(content, sourcesAt + SOURCES_SENTINEL.length);
    if (read) {
      sources = (read.value as CitedSource[]) ?? [];
      sourcesEnd = read.end;
    }
  }

  // A failed run sends __ERROR__ in place of (or after) the answer. Without
  // this the marker and its JSON render as the reply — verified against a real
  // failed stream, where the whole bubble read `__ERROR__{"message": …}`.
  const errorAt = content.indexOf(ERROR_SENTINEL);
  let error: string | null = null;
  if (errorAt !== -1) {
    const read = readJsonAt(content, errorAt + ERROR_SENTINEL.length);
    const message = (read?.value as { message?: string } | undefined)?.message;
    error = message ?? "Something went wrong generating a response.";
  }

  let answer = "";
  if (!retrieval && !partialMode) {
    if (sourcesAt === -1) {
      // No sources block yet: the answer is everything up to the first machine
      // block, which is what keeps __ERROR__ out of the bubble.
      const stop = firstBlockAt(content);
      answer = hideTrailingFragment(stop === -1 ? content : content.slice(0, stop));
    } else {
      // Prose before the sources block (normal) plus prose after it
      // (sources_first). One of the two is always empty, so the same expression
      // covers both orderings.
      const head = content.slice(0, sourcesAt);
      let tail = "";
      if (sourcesEnd !== -1) {
        const rest = content.slice(sourcesEnd);
        const stop = firstBlockAt(rest);
        tail = hideTrailingFragment(stop === -1 ? rest : rest.slice(0, stop));
      }
      answer = head + tail;
    }
    answer = answer.trim();
  }

  // Meta trails the sources. Bracket-matched like the rest, so it survives
  // sources_first putting the prose in between.
  const metaAt = content.indexOf(META_SENTINEL);
  const meta =
    metaAt === -1
      ? null
      : ((readJsonAt(content, metaAt + META_SENTINEL.length)?.value as ChatMeta | undefined) ??
        null);

  return { mode: retrieval ? "retrieval" : "synthesis", answer, sources, meta, error };
}
