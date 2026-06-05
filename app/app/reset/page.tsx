"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { updatePassword } from "../../lib/auth";

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#E8A547]/20 border-t-[#E8A547] animate-spin rounded-full"></div></div>}>
      <ResetForm />
    </Suspense>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-4 bg-[#E8A547] hover:bg-[#F5B25F] text-[#0A0B0F] rounded-xl text-sm font-bold shadow-lg shadow-[#E8A547]/30 hover:shadow-[#E8A547]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
    >
      <span className="flex items-center justify-center gap-2">
        {pending ? (
          <div className="w-4 h-4 border-2 border-[#0A0B0F]/30 border-t-[#0A0B0F] animate-spin rounded-full"></div>
        ) : (
          <>
            Update password
            <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
          </>
        )}
      </span>
    </button>
  );
}

function ResetForm() {
  const searchParams = useSearchParams();

  const error = searchParams.get("error");

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-[#E8E9ED] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Vignette gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0A0B0F_100%)] pointer-events-none z-0" />

      {/* Subtle grid backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-0" style={{
        backgroundImage: `repeating-linear-gradient(0deg, #E8A547 0px, #E8A547 1px, transparent 1px, transparent 40px),
                          repeating-linear-gradient(90deg, #E8A547 0px, #E8A547 1px, transparent 1px, transparent 40px)`,
      }} />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#E8A547] rounded-2xl mb-6 group hover:scale-105 transition-transform duration-300">
            <div className="w-4 h-4 bg-[#0A0B0F] rounded-md"></div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "Syne, sans-serif", letterSpacing: "-0.02em" }}>
            New password
          </h1>
          <p className="text-[#E8E9ED]/70 text-sm font-medium">
            Choose a new password for your account
          </p>
        </div>

        <div className="border border-[#E8A547]/20 rounded-2xl p-8 backdrop-blur-xl transition-all duration-500 group/card">

          {error && (
            <div className="mb-6 p-4 bg-[#C9534B]/10 border border-[#C9534B]/40 rounded-xl text-xs font-bold text-[#C9534B] flex items-center gap-3 animate-in shake-in-from-top-1 duration-300">
              <span className="text-lg">⚠️</span> {error}
            </div>
          )}

          <form action={updatePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#E8A547]/60 uppercase tracking-widest ml-1 font-mono">New Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-[#0A0B0F]/50 border border-[#E8A547]/20 rounded-xl outline-none focus:ring-2 focus:ring-[#E8A547]/40 focus:bg-[#0A0B0F]/80 focus:border-[#E8A547]/40 transition-all text-sm font-medium placeholder:text-[#E8E9ED]/30"
              />
              <p className="text-[11px] text-[#E8E9ED]/40 ml-1 mt-2 font-mono">At least 8 characters</p>
            </div>

            <SubmitButton />
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8A547]/20"></div>
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="px-3 bg-[#0A0B0F] text-[#E8E9ED]/50 font-mono">Changed your mind?</span>
            </div>
          </div>

          <Link
            href="/login"
            className="block mt-6 py-3 text-center bg-[#E8A547]/10 hover:bg-[#E8A547]/20 text-[#E8A547] rounded-xl text-[11px] font-bold transition-colors duration-200 border border-[#E8A547]/20"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
