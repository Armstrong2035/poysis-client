"use server";

import { createClient as createPublicClient } from "@supabase/supabase-js";

/**
 * Fetches a notebook by its slug (public — no auth required).
 * Returns id, name, config, slug, and user_id (owner) for the playground route.
 */
export async function getNotebookBySlug(slug: string) {
  const supabase = createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  );

  const { data, error } = await supabase
    .from("notebooks")
    .select("id, name, slug, config, user_id, workspace_id")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
}

/**
 * Fetches every published notebook (public — no auth required). "Published"
 * here just means it has a slug; callers still need to check each row's own
 * `config.canvas.ceiling === "public"` before treating it as marketplace-safe
 * — a notebook can be deployed (slugged) without being public.
 */
export async function getPublicNotebooks() {
  const supabase = createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  );

  const { data, error } = await supabase
    .from("notebooks")
    .select("id, name, slug, config, user_id, created_at")
    .not("slug", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching public notebooks:", error.message);
    return [];
  }
  return data ?? [];
}

export interface WaitlistEntry {
  email: string;
  /** Optional "who should we add next" request — free text. */
  nextCreator?: string;
  /** Where the signup came from (e.g. a notebook slug or "marketplace"). */
  source?: string;
}

/**
 * Adds someone to the waitlist (public — no auth required). Only a real email
 * is required so the beta invite is reachable; nextCreator ("whose knowledge
 * would you love to talk to?") is optional conversion copy, kept free text.
 */
export async function joinWaitlist({ email, nextCreator, source }: WaitlistEntry): Promise<{ error: string } | { ok: true }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  );

  const { error } = await supabase.from("waitlist").insert({
    email: cleanEmail,
    requested_creator: nextCreator?.trim() || null,
    source: source ?? null,
  });

  if (error) {
    if (error.code === "23505") return { error: "You're already on the list." };
    console.error("Error joining waitlist:", error.message);
    return { error: "Something went wrong. Try again." };
  }

  return { ok: true };
}
