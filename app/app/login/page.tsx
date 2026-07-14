"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "../../lib/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { AuthAlert } from "@/components/auth/AuthAlert";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F2EEE2]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#849F7A]/25 border-t-[#3C4A3A]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your archive."
      subtitle="Pick up right where your thinking left off."
      footer={
        <p className="text-[12px] leading-relaxed text-[#8A8672]">
          By continuing, you agree to Poysis&apos;s{" "}
          <Link
            href="/terms"
            className="border-b border-[#C9985C]/40 font-semibold text-[#7E3A33] transition-colors hover:border-[#C9985C] hover:text-[#C9985C]"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="border-b border-[#C9985C]/40 font-semibold text-[#7E3A33] transition-colors hover:border-[#C9985C] hover:text-[#C9985C]"
          >
            Privacy Policy
          </Link>
          .
        </p>
      }
    >
      {error && <AuthAlert variant="error">{error}</AuthAlert>}
      {message && <AuthAlert variant="success">{message}</AuthAlert>}

      <form action={login} className="space-y-5">
        <AuthField label="Email address" name="email" type="email" placeholder="you@domain.com" />
        <AuthField
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          action={
            <Link
              href="/forgot"
              className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#849F7A] transition-colors hover:text-[#3C4A3A]"
            >
              Forgot?
            </Link>
          }
        />
        <AuthSubmitButton label="Sign In" />
      </form>

      <div className="mt-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#E4DFCC]" />
        <span className="text-[11px] uppercase tracking-[1.5px] text-[#8A8672]">
          New here?
        </span>
        <div className="h-px flex-1 bg-[#E4DFCC]" />
      </div>

      <Link
        href="/signup"
        className="mt-5 block rounded-full border border-[#3C4A3A]/20 bg-transparent py-[13px] text-center text-[14px] font-semibold text-[#3C4A3A] transition-colors hover:bg-[#3C4A3A]/5"
      >
        Create an account
      </Link>
    </AuthShell>
  );
}
