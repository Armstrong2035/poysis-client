// Published notebooks (/<slug>) are served by the separate marketplace app,
// not studio — anywhere studio links to a published notebook needs an
// absolute URL to that app rather than a same-origin relative path.
export const MARKETPLACE_URL =
  process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? "https://poysis.com";
