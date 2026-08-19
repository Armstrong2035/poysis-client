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
import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = ReturnType<typeof createClient>;

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
 * system yet, so it's locked by default — two things open it:
 *   - `profiles.is_admin`: our own admins get the workspace app
 *     unconditionally, no plan required.
 *   - `app_metadata.enterprise`: the entitlement granted per-account until
 *     billing exists. It lives in app_metadata (admin/service-role writable
 *     only, unlike user_metadata which the user can set themselves) so a user
 *     can never self-grant it.
 * When billing lands, swap the `enterprise` half for a real subscription
 * lookup — the admin half stays as-is.
 *
 * These are async because the admin half is a DB read. Every caller is a
 * server component, server action, or route handler that already holds a
 * cookie-scoped client, so there's no client-side path into them. */

type MetaUser =
  | {
      id: string;
      app_metadata?: Record<string, unknown> | null;
      user_metadata?: Record<string, unknown> | null;
    }
  | null
  | undefined;

/**
 * Is this account one of ours? Reads `profiles.is_admin`, which RLS exposes to
 * the signed-in user for their own row.
 */
export async function isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // A failed lookup is not the same as "not an admin" — it's a schema or RLS
    // problem, and swallowing it would lock every admin out of Enterprise with
    // nothing to show for it. Log it (surfaces in Vercel function logs) and
    // fail closed, the same way ensureWorkspace surfaces its RLS gaps.
    console.error(`[isAdmin] profiles lookup failed for user ${userId}: ${error.message}`);
    return false;
  }

  return data?.is_admin === true;
}

/** Is this account allowed into Enterprise (the workspace app)? */
export async function isEnterpriseEntitled(
  supabase: SupabaseClient,
  user: MetaUser
): Promise<boolean> {
  if (!user) return false;
  // Check the granted entitlement first — it's already on the session, so an
  // entitled account never pays for the profiles round-trip.
  if (user.app_metadata?.enterprise === true) return true;
  return isAdmin(supabase, user.id);
}

/**
 * Where to send a user on entry. Non-entitled users always land in Creator
 * even if their stored mode says enterprise — the paid app is off-limits.
 */
export async function landingPathForUser(
  supabase: SupabaseClient,
  user: MetaUser
): Promise<string> {
  if (!(await isEnterpriseEntitled(supabase, user))) return "/studio";
  return uiModeLandingPath(user?.user_metadata?.ui_mode);
}
