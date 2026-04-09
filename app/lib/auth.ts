"use server";

import { createClient } from "../utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

  // Redirect to workspace after successful login
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
  const origin = (await cookies()).get("origin")?.value || "";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Signup error:", error.message);
    return redirect("/login?error=" + encodeURIComponent(error.message));
  }

  // NOTE: If manual confirmation is required, inform user.
  // For dev, you can disable email confirmation in Supabase Dashboard.
  return redirect("/login?message=" + encodeURIComponent("Check your email for confirmation link."));
}

/**
 * Log out the current user.
 */
export async function logout() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase.auth.signOut();
  return redirect("/login");
}
