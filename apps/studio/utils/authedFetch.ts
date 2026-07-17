"use client";

import { createClient } from "@/utils/supabase/client";

export async function authedFetch(url: string, options?: RequestInit): Promise<Response> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    ...(options?.headers ?? {}),
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };

  return fetch(url, { ...options, headers });
}
