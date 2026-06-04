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
