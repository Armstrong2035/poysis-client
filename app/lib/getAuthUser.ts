import type { NextRequest } from "next/server";
import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = ReturnType<typeof createClient>;

export async function getAuthUser(req: NextRequest, supabase: SupabaseClient) {
  // Try cookies first (SSR sessions)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;

  // Fallback: explicit Authorization header (client-side sessions)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user: tokenUser } } = await supabase.auth.getUser(token);
    return tokenUser ?? null;
  }

  return null;
}
