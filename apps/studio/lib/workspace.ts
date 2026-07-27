import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = ReturnType<typeof createClient>;

export async function getWorkspaceId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  // Not .single(): a user with more than one workspace row makes .single()
  // error and return null, which surfaces as a spurious "Workspace not found"
  // 404 even though rows exist (duplicates crept in before a unique constraint
  // existed). Pick one deterministically so the app stays functional; dedupe
  // the extra rows separately.
  const { data } = await supabase
    .from("workspaces")
    .select("workspace_id")
    .eq("user_id", userId)
    .order("workspace_id", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.workspace_id ?? null;
}

/**
 * Ensure the user has a workspace, creating a default one if missing.
 * Idempotent — safe to call on every auth entry point (signup with or
 * without email confirmation, and the OAuth/recovery callback).
 */
export async function ensureWorkspace(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const existing = await getWorkspaceId(supabase, userId);
  if (existing) return existing;

  const workspaceId = crypto.randomUUID();
  const { error } = await supabase.from("workspaces").insert({
    workspace_id: workspaceId,
    user_id: userId,
    name: "My Workspace",
  });
  if (error) {
    // The app uses the publishable (anon) key under RLS, so the authenticated
    // user must be allowed to INSERT their own workspace row. A swallowed error
    // here is exactly what strands an account on "Workspace not found" — log it
    // loudly (it shows in Vercel function logs) instead of returning an id for
    // a row that was never written.
    console.error(`[ensureWorkspace] insert failed for user ${userId}: ${error.message}`);
    throw new Error(`Could not create workspace: ${error.message}`);
  }
  return workspaceId;
}
