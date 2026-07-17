"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset } from "../../lib/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { AuthAlert } from "@/components/auth/AuthAlert";

export default function ForgotPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F2EEE2]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#849F7A]/25 border-t-[#3C4A3A]" />
        </div>
      }
    >
      <ForgotForm />
    </Suspense>
  );
}

function ForgotForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Let's get you back in."
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <p className="text-[12px] font-medium text-[#8A8672]">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#7E3A33] transition-colors hover:text-[#C9985C]"
          >
            Sign in instead
          </Link>
        </p>
      }
    >
      {error && <AuthAlert variant="error">{error}</AuthAlert>}
      {message && <AuthAlert variant="success">{message}</AuthAlert>}

      <form action={requestPasswordReset} className="space-y-5">
        <AuthField label="Email address" name="email" type="email" placeholder="you@domain.com" />
        <AuthSubmitButton label="Send reset link" />
      </form>

      <Link
        href="/login"
        className="mt-5 block rounded-full border border-[#3C4A3A]/20 bg-transparent py-[13px] text-center text-[14px] font-semibold text-[#3C4A3A] transition-colors hover:bg-[#3C4A3A]/5"
      >
        Back to Sign In
      </Link>
    </AuthShell>
  );
}
