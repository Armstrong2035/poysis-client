"use client";

import { useFormStatus } from "react-dom";

export function AuthSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group/btn flex w-full items-center justify-center gap-2 rounded-full bg-[#3C4A3A] py-[14px] text-[15px] font-semibold text-[#F2EEE2] shadow-[0_10px_24px_-10px_rgba(60,74,58,0.6)] transition-colors hover:bg-[#2E3A2A] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#F2EEE2]/30 border-t-[#F2EEE2]" />
      ) : (
        <>
          {label}
          <span className="transition-transform group-hover/btn:translate-x-1">→</span>
        </>
      )}
    </button>
  );
}
