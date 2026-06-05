import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = ReturnType<typeof createClient>;

export async function getWorkspaceId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("workspaces")
    .select("workspace_id")
    .eq("user_id", userId)
    .single();
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
  await supabase.from("workspaces").insert({
    workspace_id: workspaceId,
    user_id: userId,
    name: "My Workspace",
  });
  return workspaceId;
}
