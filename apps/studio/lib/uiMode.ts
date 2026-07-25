/**
 * UI mode — which app a user lands in and works from.
 *  - "creator"    → the new Creator Studio (/studio): fast path to a first notebook.
 *  - "enterprise" → the classic workspace app (/workspace): sidebar, Knowledge
 *    Map, Canvas, Sources, Teams.
 *
 * Persisted per-user in Supabase auth `user_metadata.ui_mode` (no dedicated
 * table needed). Unset = creator, so new users and anyone who's never toggled
 * lands in the new UI — the workspace is deliberately "on ice" as the default.
 */
export type UiMode = "creator" | "enterprise";

export const DEFAULT_UI_MODE: UiMode = "creator";

/** Normalize an unknown metadata value to a valid mode. */
export function toUiMode(value: unknown): UiMode {
  return value === "enterprise" ? "enterprise" : "creator";
}

/** The route a given mode lands on. */
export function uiModeLandingPath(value: unknown): string {
  return toUiMode(value) === "enterprise" ? "/workspace" : "/studio";
}

/* ── Enterprise entitlement ─────────────────────────────────────────────
 * Enterprise (the classic workspace app) is a paid tier. There's no billing
 * system yet, so it's locked for everyone by default — the only way in is an
 * admin explicitly granting it on the account. We key that off Supabase
 * `app_metadata` (admin/service-role writable only, unlike user_metadata which
 * the user can set themselves) so a user can never self-grant access. Flip the
 * source of this check to a real subscription lookup when billing lands. */

type MetaUser =
  | {
      app_metadata?: Record<string, unknown> | null;
      user_metadata?: Record<string, unknown> | null;
    }
  | null
  | undefined;

/** Is this account allowed into Enterprise (the workspace app)? */
export function isEnterpriseEntitled(user: MetaUser): boolean {
  return user?.app_metadata?.enterprise === true;
}

/**
 * Where to send a user on entry. Non-entitled users always land in Creator
 * even if their stored mode says enterprise — the paid app is off-limits.
 */
export function landingPathForUser(user: MetaUser): string {
  if (!isEnterpriseEntitled(user)) return "/studio";
  return uiModeLandingPath(user?.user_metadata?.ui_mode);
}
