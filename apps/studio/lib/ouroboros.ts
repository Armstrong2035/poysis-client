import { readFileSync } from "fs";
import { join } from "path";

const FALLBACK =
  "Help the user decide what kind of notebook to build and how to configure it well. Ask about their goal before recommending anything.";

let cached: string | null = null;

/**
 * Loads docs/ouroboros.md — the notebook-building philosophy the onboarding
 * chat argues from. Cached after first read since the doc doesn't change
 * within a running process. Falls back to a short default rather than
 * throwing if the file isn't reachable (e.g. a deploy that doesn't include
 * the repo-root docs/ directory) — flagged as something to verify in prod,
 * not something that should take the chat down if it goes wrong.
 */
export function loadOuroboros(): string {
  if (cached !== null) return cached;
  try {
    cached = readFileSync(join(process.cwd(), "..", "docs", "ouroboros.md"), "utf-8");
  } catch (err) {
    console.error("[ouroboros] Failed to load docs/ouroboros.md, using fallback:", err);
    cached = FALLBACK;
  }
  return cached;
}
