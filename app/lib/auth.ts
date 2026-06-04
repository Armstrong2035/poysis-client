"use server";

import { createClient } from "../utils/supabase/server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Log in a user with email and password.
 */
export async function login(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error.message);
    return redirect("/login?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/", "layout");
  return redirect("/workspace");
}

/**
 * Sign up a new user with email and password.
 */
export async function signup(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const origin = (await headers()).get("origin") ?? "";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Signup error:", error.message);
    return redirect("/signup?error=" + encodeURIComponent(error.message));
  }

  // Email confirmation is disabled — session is immediately available
  if (data.session) {
    await supabase.from("workspaces").insert({
      workspace_id: crypto.randomUUID(),
      user_id: data.session.user.id,
      name: "My Workspace",
    });

    revalidatePath("/", "layout");
    return redirect("/workspace");
  }

  // Email confirmation is enabled — tell user to check their inbox
  return redirect("/login?message=" + encodeURIComponent("Check your email to confirm your account."));
}

/**
 * Log out the current user.
 */
export async function logout() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return redirect("/login");
}
