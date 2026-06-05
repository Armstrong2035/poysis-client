"use server";

import { createClient } from "../utils/supabase/server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureWorkspace } from "./workspace";

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

  // Email confirmation is disabled — session is immediately available, so
  // create the workspace now and head straight into the app.
  if (data.session) {
    await ensureWorkspace(supabase, data.session.user.id);

    revalidatePath("/", "layout");
    return redirect("/workspace");
  }

  // Email confirmation is enabled — no session yet. The workspace is created
  // in /auth/callback once the user confirms. Tell them to check their inbox.
  return redirect("/login?message=" + encodeURIComponent("Check your email to confirm your account."));
}

/**
 * Send a password-reset email. The link returns the user to /auth/callback,
 * which exchanges the code for a session and forwards to /reset.
 */
export async function requestPasswordReset(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const email = formData.get("email") as string;
  const origin = (await headers()).get("origin") ?? "";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset`,
  });

  if (error) {
    console.error("Password reset error:", error.message);
    return redirect("/forgot?error=" + encodeURIComponent(error.message));
  }

  // Always report success — don't reveal whether an account exists.
  return redirect(
    "/forgot?message=" +
      encodeURIComponent("Check your email for a password reset link."),
  );
}

/**
 * Update the current user's password. Requires the recovery session
 * established by clicking the reset link.
 */
export async function updatePassword(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Update password error:", error.message);
    return redirect("/reset?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/", "layout");
  return redirect(
    "/login?message=" +
      encodeURIComponent("Password updated. Sign in with your new password."),
  );
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
