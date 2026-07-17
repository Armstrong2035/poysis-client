// Published notebooks (/<slug>) are served by the separate marketplace app,
// not studio — anywhere studio links to a published notebook needs an
// absolute URL to that app rather than a same-origin relative path.
export const MARKETPLACE_URL =
  process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? "https://poysis.com";

// How a notebook presents itself in the public marketplace directory. Stored
// under config.marketplace on the notebook; every field is optional — a
// notebook with none of it set still lists (title/theme come from the notebook
// itself), just with a plainer card. Keep these keys in sync with the reader
// in apps/marketplace/lib/creators.ts.
export type MarketplaceMeta = {
  /** Creator handle or name shown under the title, e.g. "@ElenaCross". */
  creator?: string;
  /** Single category powering "Browse by domain" — keep to a consistent set. */
  domain?: string;
  /** Granular tags — power the home-page filter chips and search. */
  topics?: string[];
  /** One-line pitch for cards. */
  tagline?: string;
  /** Longer blurb for the notebook page. */
  description?: string;
  /** Suggested prompts (answers come live from the worker — not stored). */
  questions?: string[];
  /** Manually curated "N sources indexed" count. */
  sourceCount?: number;
  /** One of the named palette colors below; unset = auto from the slug. */
  color?: string;
  /** Feature on the home feed as "Just Dropped". */
  featured?: boolean;
  /** Show in the home feed's "Trending" row. */
  trending?: boolean;
};

// The marketplace's card palette, mirrored here so the Studio picker matches
// exactly what renders publicly.
export const MARKETPLACE_COLORS: { id: string; label: string; hex: string }[] = [
  { id: "olive", label: "Olive", hex: "#3C4A3A" },
  { id: "oxblood", label: "Oxblood", hex: "#7E3A33" },
  { id: "sage", label: "Sage", hex: "#84977A" },
  { id: "clay", label: "Clay", hex: "#C98A5D" },
  { id: "stone", label: "Stone", hex: "#55594D" },
  { id: "ink", label: "Ink", hex: "#262922" },
];
