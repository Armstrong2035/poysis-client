"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { updatePassword } from "../../lib/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { AuthAlert } from "@/components/auth/AuthAlert";

export default function ResetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F2EEE2]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#849F7A]/25 border-t-[#3C4A3A]" />
        </div>
      }
    >
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Choose a new password."
      subtitle="Pick something memorable — you'll use it every time you return."
    >
      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      <form action={updatePassword} className="space-y-5">
        <AuthField
          label="New password"
          name="password"
          type="password"
          placeholder="••••••••"
          hint="At least 8 characters"
        />
        <AuthSubmitButton label="Update password" />
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
