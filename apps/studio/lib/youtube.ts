/**
 * Per-channel indexing limits for YouTube sources.
 *
 * The cap used to be a fixed worker-side default (~45 minutes) applied to
 * every channel. It's now chosen per channel at connect time, because what
 * counts as "too long to be worth indexing" depends entirely on the channel:
 * a tutorial channel's useful videos are minutes long, while an interview or
 * conference channel's are hours. 45 stays the default so existing behaviour
 * is what you get if you don't touch it.
 */

export const DEFAULT_MAX_VIDEO_MINUTES = 45;

/** 10 hours — past this we're almost certainly looking at a typo or a livestream archive. */
export const MAX_VIDEO_MINUTES_LIMIT = 600;
export const MIN_VIDEO_MINUTES_LIMIT = 1;

export const MAX_VIDEO_MINUTES_ERROR = `Enter a whole number of minutes between ${MIN_VIDEO_MINUTES_LIMIT} and ${MAX_VIDEO_MINUTES_LIMIT}.`;

export const MAX_VIDEO_MINUTES_HELP =
  "Videos longer than this are skipped when the channel is indexed. Pick a cap that matches the channel: short for tutorials or news, longer for interviews and talks. Defaults to 45 minutes.";

/**
 * Returns the validated minute cap, or null when the input can't be used.
 * Shared by the connect form and the API route so the client and the server
 * can never disagree about what's acceptable.
 */
export function parseMaxVideoMinutes(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return DEFAULT_MAX_VIDEO_MINUTES;

  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (n < MIN_VIDEO_MINUTES_LIMIT || n > MAX_VIDEO_MINUTES_LIMIT) return null;

  return n;
}
