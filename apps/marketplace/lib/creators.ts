import { getPublicNotebooks, getNotebookBySlug } from "./actions";

export type CreatorColor = "olive" | "oxblood" | "sage" | "clay" | "stone" | "ink";

export const PALETTE: Record<CreatorColor, { bg: string; fg: string }> = {
  olive: { bg: "#3C4A3A", fg: "#F1EEE2" },
  oxblood: { bg: "#7E3A33", fg: "#F1EEE2" },
  sage: { bg: "#84977A", fg: "#262922" },
  clay: { bg: "#C98A5D", fg: "#262922" },
  stone: { bg: "#55594D", fg: "#F1EEE2" },
  ink: { bg: "#262922", fg: "#F1EEE2" },
};

const PALETTE_KEYS = Object.keys(PALETTE) as CreatorColor[];
const VALID_COLORS = new Set<string>(PALETTE_KEYS);

/** Deterministic (not random) color for anything not given an explicit `color`. */
export function colorForKey(key: string): CreatorColor {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE_KEYS[hash % PALETTE_KEYS.length];
}

// A notebook opts into richer marketplace presentation by setting this
// `marketplace` key in its own config JSON — the same place `canvas`
// metadata already lives (see apps/studio's NotebooksContext). Every field
// is optional: a notebook with none of this set still gets listed (as long
// as it's published + public), just with plainer cards.
export interface NotebookMarketplaceMeta {
  creator?: string;
  domain?: string;
  topics?: string[];
  tagline?: string;
  description?: string;
  questions?: string[];
  sourceCount?: number;
  color?: string;
  featured?: boolean;
  trending?: boolean;
}

export interface ResolvedCreator {
  slug: string;
  id: string;
  title: string;
  initial: string;
  firstName: string;
  creator: string;
  domain: string;
  topics: string[];
  tagline: string;
  description: string;
  questions: string[];
  sourceCount?: number;
  color: CreatorColor;
  featured: boolean;
  trending: boolean;
}

// Mirrors the design's rule for turning a title into a first-name-ish form
// for copy like "Ask {firstName} anything" when no explicit creator handle
// is set — strips common leading titles, otherwise takes the first word.
function firstNameOf(title: string): string {
  if (title.startsWith("The ") || title.startsWith("Founder")) return title;
  const stripped = title.replace(/^Dr\.\s*/, "").replace(/^Brother\s*/, "");
  return stripped.split(" ")[0] || title;
}

function isPublic(notebook: { config: any }): boolean {
  return (notebook.config?.canvas?.ceiling ?? "private") === "public";
}

function resolve(notebook: { id: string; name: string; slug: string | null; config: any }): ResolvedCreator {
  const meta: NotebookMarketplaceMeta = notebook.config?.marketplace ?? {};
  const title = notebook.config?.theme?.appLabel ?? notebook.name ?? notebook.slug ?? "Untitled";
  const color = VALID_COLORS.has(meta.color ?? "") ? (meta.color as CreatorColor) : colorForKey(notebook.slug ?? notebook.id);

  return {
    slug: notebook.slug!,
    id: notebook.id,
    title,
    initial: title.trim()[0]?.toUpperCase() ?? "?",
    firstName: meta.creator ? meta.creator.replace(/^@/, "") : firstNameOf(title),
    creator: meta.creator ?? "",
    domain: meta.domain ?? "General",
    topics: meta.topics ?? [],
    tagline: meta.tagline ?? meta.description ?? "Ask me anything — trained on the full source material.",
    description: meta.description ?? meta.tagline ?? "Ask me anything — trained on the full source material.",
    questions: meta.questions ?? [],
    sourceCount: meta.sourceCount,
    color,
    featured: meta.featured ?? false,
    trending: meta.trending ?? false,
  };
}

export async function getAllCreators(): Promise<ResolvedCreator[]> {
  const notebooks = await getPublicNotebooks();
  return notebooks.filter(isPublic).map(resolve);
}

export async function getCreatorBySlug(slug: string): Promise<ResolvedCreator | null> {
  const notebook = await getNotebookBySlug(slug);
  if (!notebook || !isPublic(notebook)) return null;
  return resolve(notebook);
}

export function getFeatured(creators: ResolvedCreator[]): ResolvedCreator | null {
  return creators.find((c) => c.featured) ?? null;
}

export function getTrending(creators: ResolvedCreator[], excludeSlug?: string): ResolvedCreator[] {
  return creators.filter((c) => c.trending && c.slug !== excludeSlug);
}

// `getAllCreators` already orders by created_at desc, so "latest" is just
// the front of the list.
export function getLatest(creators: ResolvedCreator[], limit = 5): ResolvedCreator[] {
  return creators.slice(0, limit);
}

export interface DomainCard {
  name: string;
  count: number;
  color: CreatorColor;
}

// Unique topics across all listed notebooks, most-common first, for the home
// page's quick-filter chips. Capped so the row stays a single tidy cluster.
export function getTopics(creators: ResolvedCreator[], limit = 8): string[] {
  const counts = new Map<string, number>();
  for (const c of creators) {
    for (const t of c.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

export function getDomains(creators: ResolvedCreator[]): DomainCard[] {
  const counts = new Map<string, number>();
  for (const c of creators) counts.set(c.domain, (counts.get(c.domain) ?? 0) + 1);
  return [...counts.entries()].map(([name, count]) => ({
    name,
    count,
    color: colorForKey(name),
  }));
}

export function searchCreators(creators: ResolvedCreator[], query: string): ResolvedCreator[] {
  const q = query.toLowerCase().trim();
  if (!q) return creators;
  return creators.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.creator.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q) ||
      c.topics.some((t) => t.toLowerCase().includes(q)),
  );
}

export function filterByDomain(creators: ResolvedCreator[], domain: string): ResolvedCreator[] {
  return creators.filter((c) => c.domain === domain);
}

export function related(creators: ResolvedCreator[], current: ResolvedCreator, limit = 3): ResolvedCreator[] {
  const sameDomain = creators.filter((c) => c.slug !== current.slug && c.domain === current.domain);
  if (sameDomain.length >= limit) return sameDomain.slice(0, limit);
  const rest = creators.filter((c) => c.slug !== current.slug && c.domain !== current.domain);
  return [...sameDomain, ...rest].slice(0, limit);
}
