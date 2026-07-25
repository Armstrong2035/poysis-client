import type { MarketplaceMeta } from "./marketplace";

/**
 * Publish-readiness: the criteria that must be green before a notebook can be
 * shared, computed entirely from the notebook's own config — no server call.
 *
 * Two gates, deliberately different in strictness:
 *   - "publish"  — getting any shareable link (a slug). Requires only that the
 *                  notebook actually has knowledge behind it.
 *   - "public"   — making the notebook marketplace-eligible (ceiling = public).
 *                  Additionally requires the listing essentials so the public
 *                  card reads well. A private/team link never needs these.
 *
 * Keep the listing-essential checks in sync with what a marketplace card needs
 * to look complete (see apps/marketplace/lib/creators.ts).
 */
export type ReadinessGate = "publish" | "public";

export type ReadinessCheck = {
  id: string;
  label: string;
  ok: boolean;
  gate: ReadinessGate;
};

export type ReadinessInput = {
  /** Number of `topic:` clusters attached to the notebook. */
  clusterCount: number;
  /** Whether any `conn:` (whole-source) connection is attached. */
  hasConnectionSource: boolean;
  /** The notebook's marketplace listing draft (config.marketplace). */
  marketplace: MarketplaceMeta;
};

export function publishReadiness(input: ReadinessInput): ReadinessCheck[] {
  const hasKnowledge = input.clusterCount > 0 || input.hasConnectionSource;
  const m = input.marketplace ?? {};
  return [
    {
      id: "knowledge",
      gate: "publish",
      ok: hasKnowledge,
      label: "A knowledge cluster or source is attached",
    },
    {
      id: "domain",
      gate: "public",
      ok: !!m.domain?.trim(),
      label: "Listing has a domain",
    },
    {
      id: "tagline",
      gate: "public",
      ok: !!m.tagline?.trim(),
      label: "Listing has a tagline",
    },
  ];
}

/** The checks that gate a given action — "publish" alone, or both gates for "public". */
export function checksForGate(checks: ReadinessCheck[], gate: ReadinessGate): ReadinessCheck[] {
  return gate === "public" ? checks : checks.filter((c) => c.gate === "publish");
}

/** Can the notebook be published (assigned a shareable link)? */
export function canPublish(checks: ReadinessCheck[]): boolean {
  return checksForGate(checks, "publish").every((c) => c.ok);
}

/** Can the notebook be set public (marketplace-eligible)? Both gates must pass. */
export function canGoPublic(checks: ReadinessCheck[]): boolean {
  return checks.every((c) => c.ok);
}

/** The still-unmet checks blocking a given action, for surfacing "why". */
export function unmet(checks: ReadinessCheck[], gate: ReadinessGate): ReadinessCheck[] {
  return checksForGate(checks, gate).filter((c) => !c.ok);
}
