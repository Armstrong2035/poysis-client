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
  /** A seeded placeholder (not a real notebook) — renders locked with a
   *  "coming soon" padlock and isn't clickable. */
  comingSoon: boolean;
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
    comingSoon: false,
  };
}

export async function getAllCreators(): Promise<ResolvedCreator[]> {
  const notebooks = await getPublicNotebooks();
  return notebooks.filter(isPublic).map(resolve);
}

// Seeded "coming soon" placeholders so the marketplace looks alive while the
// real catalog fills in. These are NOT notebooks — they render locked (padlock,
// non-clickable) and only advertise creators we intend to index. Neutral
// topic-level descriptions only; no fabricated quotes or claims to be them.
function comingSoon(input: {
  title: string;
  creator: string;
  domain: string;
  topics: string[];
  tagline: string;
  sourceCount: number;
  color: CreatorColor;
  trending?: boolean;
}): ResolvedCreator {
  return {
    slug: "",
    id: `coming-${input.title.toLowerCase().replace(/\s+/g, "-")}`,
    title: input.title,
    initial: input.title.trim()[0]?.toUpperCase() ?? "?",
    firstName: firstNameOf(input.title),
    creator: input.creator,
    domain: input.domain,
    topics: input.topics,
    tagline: input.tagline,
    description: input.tagline,
    questions: [],
    sourceCount: input.sourceCount,
    color: input.color,
    featured: false,
    trending: input.trending ?? false,
    comingSoon: true,
  };
}

const COMING_SOON: ResolvedCreator[] = [
  comingSoon({ title: "Sam Adeyemi", creator: "@sam_adeyemi", domain: "Leadership", topics: ["leadership", "purpose", "growth"], tagline: "Leadership, purpose, and personal transformation, from years of talks and teaching.", sourceCount: 140, color: "olive", trending: true }),
  comingSoon({ title: "Alex Hormozi", creator: "@hormozi", domain: "Business", topics: ["sales", "offers", "scaling"], tagline: "Offers, sales, and scaling businesses from zero to millions.", sourceCount: 210, color: "clay", trending: true }),
  comingSoon({ title: "Naval Ravikant", creator: "@naval", domain: "Startups", topics: ["wealth", "leverage", "philosophy"], tagline: "Wealth creation, leverage, and clear thinking, across a decade of talks and threads.", sourceCount: 180, color: "stone", trending: true }),
  comingSoon({ title: "Paul Graham", creator: "@paulg", domain: "Essays", topics: ["startups", "founders", "writing"], tagline: "Essays and talks on startups, founders, and writing clearly.", sourceCount: 160, color: "oxblood" }),
  comingSoon({ title: "Andrew Huberman", creator: "@hubermanlab", domain: "Neuroscience", topics: ["focus", "sleep", "dopamine"], tagline: "Science-backed protocols for focus, sleep, stress, and performance.", sourceCount: 240, color: "sage", trending: true }),
  comingSoon({ title: "Morgan Housel", creator: "@morganhousel", domain: "Investing", topics: ["money", "psychology", "markets"], tagline: "How money really works — behavior, risk, and long-term thinking.", sourceCount: 120, color: "ink", trending: true }),
  comingSoon({ title: "Chimamanda Ngozi Adichie", creator: "@chimamanda", domain: "Writing", topics: ["storytelling", "identity", "culture"], tagline: "Storytelling, identity, and culture, across novels, essays, and talks.", sourceCount: 90, color: "oxblood" }),
  comingSoon({ title: "Simon Sinek", creator: "@simonsinek", domain: "Leadership", topics: ["purpose", "teams", "trust"], tagline: "Why great teams start with purpose, trust, and the long game.", sourceCount: 150, color: "clay", trending: true }),
  comingSoon({ title: "Brené Brown", creator: "@brenebrown", domain: "Psychology", topics: ["vulnerability", "courage", "shame"], tagline: "Vulnerability, courage, and connection, from a career of research.", sourceCount: 170, color: "stone" }),
  comingSoon({ title: "Yuval Noah Harari", creator: "@harari_yuval", domain: "History", topics: ["history", "ai", "society"], tagline: "The long arc of humanity — history, technology, and where we're headed.", sourceCount: 200, color: "sage" }),
  comingSoon({ title: "Esther Perel", creator: "@estherperel", domain: "Relationships", topics: ["intimacy", "work", "connection"], tagline: "Relationships, intimacy, and the modern tension between the two.", sourceCount: 110, color: "olive" }),
  comingSoon({ title: "Ali Abdaal", creator: "@aliabdaal", domain: "Productivity", topics: ["productivity", "learning", "creators"], tagline: "Evidence-based productivity, learning, and building an audience.", sourceCount: 130, color: "ink" }),
  comingSoon({ title: "Andrej Karpathy", creator: "@karpathy", domain: "AI", topics: ["deep learning", "llms", "neural nets"], tagline: "Neural networks, LLMs, and how modern AI actually works.", sourceCount: 175, color: "ink", trending: true }),
  comingSoon({ title: "Priscilla Shirer", creator: "@priscillashirer", domain: "Christianity", topics: ["faith", "prayer", "scripture"], tagline: "Scripture, prayer, and living out faith day to day.", sourceCount: 100, color: "olive" }),
  comingSoon({ title: "Peter Attia", creator: "@peterattiamd", domain: "Health", topics: ["longevity", "fitness", "medicine"], tagline: "Longevity, training, and the science of living better, longer.", sourceCount: 190, color: "sage" }),
  comingSoon({ title: "Jay Shetty", creator: "@jayshetty", domain: "Mindfulness", topics: ["mindfulness", "purpose", "relationships"], tagline: "Mindfulness, purpose, and everyday wisdom.", sourceCount: 160, color: "clay" }),
  comingSoon({ title: "Ramit Sethi", creator: "@ramit", domain: "Personal Finance", topics: ["money", "spending", "psychology"], tagline: "Spending, saving, and a rich life on your own terms.", sourceCount: 140, color: "oxblood" }),
];

/** The seeded "coming soon" placeholders, mixed into the feed alongside real
 *  (clickable) notebooks. Returns fresh copies so callers can't mutate them. */
export function getComingSoon(): ResolvedCreator[] {
  return COMING_SOON.map((c) => ({ ...c }));
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
